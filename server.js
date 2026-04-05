require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ngrok = require('@ngrok/ngrok');
const basicAuth = require('express-basic-auth');
const multer  = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Kimlik Doğrulama ---
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS;
if (!BASIC_AUTH_USER || !BASIC_AUTH_PASS) {
    throw new Error('BASIC_AUTH_USER ve BASIC_AUTH_PASS ortam değişkenleri tanımlı olmalı.');
}
app.use(basicAuth({
    users: { [BASIC_AUTH_USER]: BASIC_AUTH_PASS },
    challenge: true,
    unauthorizedResponse: 'Yetkisiz erişim! Lütfen giriş yapın.'
}));

app.use(express.json());
app.use(express.static('public'));

let minecraftProcess = null;
let consoleHistory = [];

const PORT = process.env.PORT || 3000;
const SERVER_PATH = process.env.SERVER_PATH;
const CONFIG_FILE = path.join(__dirname, 'panel-config.json');

// Varsayılan ayarlar
let SERVER_ROOT = SERVER_PATH || process.cwd();
let currentServerPath = SERVER_ROOT; 
let customStartPath = ''; 

// Ayarları dosyadan oku
if (fs.existsSync(CONFIG_FILE) && !SERVER_PATH) {
    try {
        const conf = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (conf.serverPath) currentServerPath = conf.serverPath;
        if (conf.startFile) customStartPath = conf.startFile;
    } catch(e) { console.error('Konfig okunamadı'); }
}

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ serverPath: currentServerPath, startFile: customStartPath }), 'utf8');
    } catch(e) {}
}

function pushLog(msg) {
    consoleHistory.push(msg);
    if (consoleHistory.length > 500) consoleHistory.shift();
}

// --- API Rotası: Plugin İstatisitk (POST) ---
app.post('/api/server-stats', (req, res) => {
    const { tps, players, ram, maxRam, packetAnalysis, chunkAnalysis } = req.body;
    io.emit('statsUpdate', {
        tps: tps || '0.00',
        players: players || 0,
        ram: ram || 0,
        maxRam: maxRam || 0,
        packetAnalysis: packetAnalysis || [],
        chunkAnalysis: chunkAnalysis || []
    });
    res.json({ success: true });
});

// --- API Rotası: Ayarları Oku ---
app.get('/api/get-properties', (req, res) => {
    const filePath = path.join(currentServerPath, 'server.properties');
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'server.properties bulunamadı!' });
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const settings = {};
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex !== -1) {
                    settings[trimmed.substring(0, eqIndex).trim()] = trimmed.substring(eqIndex + 1).trim();
                }
            }
        });
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Rotası: Ayarları Kaydet ---
app.post('/api/save-properties', (req, res) => {
    const filePath = path.join(currentServerPath, 'server.properties');
    const { settings } = req.body;
    try {
        let headerLines = ['#Minecraft server properties'];
        if (fs.existsSync(filePath)) {
            const lines = fs.readFileSync(filePath, 'utf8').split('\n');
            const comments = lines.filter(l => l.trim().startsWith('#'));
            if (comments.length > 0) headerLines = comments;
        }
        const settingsStr = Object.entries(settings).map(([k, v]) => `${k}=${v}`).join('\n');
        fs.writeFileSync(filePath, headerLines.join('\n') + '\n' + settingsStr + '\n', 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Rotası: Klasör İçeriğini Gör ---
app.get('/api/files', (req, res) => {
    const queryPath = req.query.path || '';
    if (queryPath.includes('..')) return res.status(403).json({ error: 'Geçersiz yol!' });
    
    const targetPath = path.join(currentServerPath, queryPath);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Klasör bulunamadı' });
    
    try {
        const items = fs.readdirSync(targetPath);
        const result = items.map(item => {
            const itemPath = path.join(targetPath, item);
            const stats = fs.statSync(itemPath);
            return {
                name: item,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                modifiedDate: stats.mtime
            };
        });
        result.sort((a,b) => (b.isDirectory - a.isDirectory) || a.name.localeCompare(b.name));
        res.json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Rotası: Dosya Oku ---
app.get('/api/file/read', (req, res) => {
    const queryPath = req.query.path || '';
    if (queryPath.includes('..')) return res.status(403).json({ error: 'Geçersiz yol!' });
    
    const targetPath = path.join(currentServerPath, queryPath);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Dosya bulunamadı' });
    
    try {
        const content = fs.readFileSync(targetPath, 'utf8');
        res.type('text/plain').send(content);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Rotası: Dosya Kaydet ---
app.post('/api/file/save', (req, res) => {
    const { path: queryPath, content } = req.body;
    if (!queryPath || queryPath.includes('..')) return res.status(403).json({ error: 'Geçersiz yol!' });
    
    const targetPath = path.join(currentServerPath, queryPath);
    try {
        fs.writeFileSync(targetPath, content, 'utf8');
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Rotası: Dosya Sil ---
app.delete('/api/file/delete', (req, res) => {
    const queryPath = req.query.path || '';
    if (!queryPath || queryPath.includes('..')) return res.status(403).json({ error: 'Geçersiz yol!' });
    
    const targetPath = path.join(currentServerPath, queryPath);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Dosya/Klasör bulunamadı' });

    try {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
            fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(targetPath);
        }
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Rotası: Dosya Yükle ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = req.body.path || '';
        if (uploadPath.includes('..')) return cb(new Error('Geçersiz yol!'));
        const targetDir = path.join(currentServerPath, uploadPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

app.post('/api/file/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenemedi.' });
    res.json({ success: true, filename: req.file.originalname });
});

// --- API Rotası: Playit.gg ---
let playitProcess = null;

app.post('/api/playit/start', (req, res) => {
    if (playitProcess) return res.json({ error: 'Playit zaten çalışıyor!' });

    let playitPath = path.join(currentServerPath, 'playit.exe');
    if (!fs.existsSync(playitPath)) {
        playitPath = path.join(currentServerPath, 'playit');
    }
    
    if (!fs.existsSync(playitPath)) {
        return res.json({ error: `Ana dizinde playit bulunamadı! Lütfen playit dosyasını şu klasöre ekleyin: ${currentServerPath}` });
    }

    playitProcess = spawn(playitPath, [], { cwd: currentServerPath, shell: true });

    const processPlayitLog = (chunk) => {
        let text = chunk.toString();
        // 1. ANSI kaçış kodlarını temizle
        text = text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
        
        // 2. Boşlukları temizle
        text = text.trim();
        if (text.length === 0) return;

        // 3. Spam Filtresi: Sadece rakam ve boşluktan oluşan satırları yoksay
        if (/^[\d\s]+$/.test(text)) return;

        // 4. Spam Filtresi: ASCII tablo çizim karakterleri içeren satırları yoksay
        if (/[┌─│└├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬]/.test(text)) return;
        
        // 5. Temizlenmiş ve anlamlı logu gönder
        pushLog('[PLAYIT] ' + text); 
        io.emit('console-output', '[PLAYIT] ' + text);
        
        const claimMatch = text.match(/(https:\/\/playit\.gg\/claim\/[a-zA-Z0-9]+)/);
        if (claimMatch) io.emit('playitClaimLink', claimMatch[1]);
        
        // 6. Dinamik IP / Domain Yakalayıcı Regex
        const ipMatch = text.match(/([a-zA-Z0-9.-]+(?:playit\.gg|joinmc\.link))/);
        if (ipMatch && ipMatch[1]) {
            io.emit('playitIP', ipMatch[1]);
        }
    };

    playitProcess.stdout.on('data', processPlayitLog);
    playitProcess.stderr.on('data', processPlayitLog);

    playitProcess.on('close', code => {
        playitProcess = null;
        io.emit('playitStatus', { running: false });
    });

    io.emit('playitStatus', { running: true });
    res.json({ success: true });
});

app.post('/api/playit/stop', (req, res) => {
    if (playitProcess) {
        playitProcess.kill('SIGKILL');
        playitProcess = null;
        io.emit('playitStatus', { running: false });
        res.json({ success: true });
    } else {
        res.json({ error: 'Playit çalışmıyor.' });
    }
});

app.get('/api/playit/status', (req, res) => {
    res.json({ running: playitProcess !== null });
});

app.get('/api/status', (req, res) => {
    res.json({ running: minecraftProcess !== null, path: currentServerPath });
});

// --- Socket.io ---
io.on('connection', (socket) => {
    socket.emit('server-status', { running: minecraftProcess !== null });
    if (consoleHistory.length > 0) socket.emit('console-history', consoleHistory);

    socket.on('start-server', () => {
        if (minecraftProcess) return socket.emit('console-output', '[PANEL] Sunucu saten çalışıyor!');
        
        let startFile = customStartPath;
        let useJar = false;
        
        if (!startFile || startFile === '') {
            try {
                const files = fs.readdirSync(currentServerPath);
                startFile = files.find(f => f.toLowerCase().endsWith('.bat'));
                if (!startFile) {
                    startFile = files.find(f => f.toLowerCase().endsWith('.jar') && !f.toLowerCase().includes('installer'));
                }
            } catch(e) {
                return socket.emit('console-output', `[PANEL] Dizin okunamadı: ${currentServerPath}`);
            }
        }

        if (!startFile) return socket.emit('console-output', `[PANEL] '${currentServerPath}' dizininde başlatma dosyası bulunamadı! Lütfen server.js içindeki ayarları güncelleyin.`);
        
        if (startFile.toLowerCase().endsWith('.jar')) useJar = true;

        const logMsg = `[PANEL] Başlatılıyor: ${startFile}`;
        pushLog(logMsg); io.emit('console-output', logMsg);

        if (useJar) {
            minecraftProcess = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', startFile, 'nogui'], { cwd: currentServerPath, shell: true });
        } else {
            minecraftProcess = spawn('cmd.exe', ['/c', startFile], { cwd: currentServerPath, shell: true });
        }

        minecraftProcess.stdout.on('data', chunk => {
            const text = chunk.toString();
            pushLog(text); io.emit('console-output', text);
        });

        minecraftProcess.stderr.on('data', chunk => {
            const text = chunk.toString();
            pushLog(text); io.emit('console-output', text);
        });

        minecraftProcess.on('close', code => {
            const msg = `[PANEL] Sunucu durdu (Çıkış kodu: ${code})`;
            pushLog(msg); io.emit('console-output', msg);
            minecraftProcess = null;
            io.emit('server-status', { running: false });
            io.emit('statsUpdate', { tps: '0', players: 0, ram: 0, maxRam: 0 });
        });

        io.emit('server-status', { running: true });
    });

    socket.on('stop-server', () => {
        if (!minecraftProcess) return socket.emit('console-output', '[PANEL] Çalışan sunucu yok!');
        pushLog('[PANEL] Durduruluyor...'); io.emit('console-output', '[PANEL] Durduruluyor...');
        try { minecraftProcess.stdin.write('stop\n'); } catch (e) {}
        setTimeout(() => {
            if (minecraftProcess) {
                minecraftProcess.kill('SIGKILL');
                minecraftProcess = null;
                io.emit('server-status', { running: false });
            }
        }, 8000);
    });

    socket.on('send-command', (cmd) => {
        if (!minecraftProcess || !minecraftProcess.stdin) return socket.emit('console-output', '[PANEL] Sunucu aktif değil.');
        minecraftProcess.stdin.write(cmd + '\n');
        pushLog('> ' + cmd); io.emit('console-output', '> ' + cmd);
    });

    socket.on('get-settings', () => {
        socket.emit('current-settings', { serverPath: currentServerPath, startFile: customStartPath });
    });

    socket.on('update-settings', (data) => {
        currentServerPath = data.serverPath;
        customStartPath = data.startFile;
        saveConfig();
        pushLog('[PANEL] Sunucu yolları kaydedildi.');
        io.emit('console-output', '[PANEL] Sunucu yolları html üzerinden kaydedildi.');
    });
});

// --- Başlatma ---
server.listen(PORT, async () => {
    console.log(`\n--- WEB PANEL ÇALIŞIYOR ---`);
    console.log(`-> Yerel Port: ${PORT}`);
    try {
        const ngrokConfig = { addr: PORT };
        if (process.env.NGROK_AUTHTOKEN) ngrokConfig.authtoken = process.env.NGROK_AUTHTOKEN;
        const listener = await ngrok.forward(ngrokConfig);
        console.log(`-> NGROK TÜNELİ: ${listener.url()}`);
    } catch (err) {
        console.log(`-> Ngrok tünel hatası: ${err.message}`);
    }
    console.log(`---------------------------\n`);
});
