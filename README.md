🚀 Buny Panel v2.0 | Full Project Documentation & Setup
Bu döküman, Buny Panel v2.0 projesinin tüm kaynak kodlarını (Java Agent hariç) ve sistemi dış dünyaya en güvenli şekilde açma rehberini içerir.

1. Yapılandırma Dosyaları
📄 .env (Hassas Bilgiler)
Kod snippet'i
# Minecraft sunucunuzun bilgisayarınızdaki tam yolu
SERVER_PATH=C:/MinecraftSunucum/
PORT=3000
📄 .gitignore (Gizlilik Ayarları)
Kod snippet'i
node_modules/
.env
*.log
AgentPlugin/target/
2. Backend Sunucusu (Node.js)
📄 server.js
JavaScript
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(__dirname));

const SERVER_PATH = process.env.SERVER_PATH;

if (!SERVER_PATH || !fs.existsSync(SERVER_PATH)) {
    console.error("KRİTİK HATA: .env dosyasındaki SERVER_PATH geçersiz!");
    process.exit(1);
}

// Java Agent'tan gelen veriyi anlık olarak Socket.io üzerinden arayüze ilet
app.post('/api/server-data', (req, res) => {
    io.emit('live-data', req.body);
    res.sendStatus(200);
});

// GÜVENLİ DOSYA YÖNETİCİSİ FONKSİYONU
const getSafePath = (target) => {
    const safePath = path.normalize(path.join(SERVER_PATH, target || ''));
    if (!safePath.startsWith(path.normalize(SERVER_PATH))) return null;
    return safePath;
};

// Dizin Listeleme Rotosu
app.get('/api/files', (req, res) => {
    const fullPath = getSafePath(req.query.dir);
    if (!fullPath) return res.status(403).json({ error: 'Erişim reddedildi' });
    
    try {
        const files = fs.readdirSync(fullPath, { withFileTypes: true }).map(f => ({
            name: f.name,
            isDirectory: f.isDirectory()
        }));
        res.json(files);
    } catch (e) { res.status(500).send("Dizin okunamadı"); }
});

// Dosya Okuma Rotosu
app.get('/api/file/read', (req, res) => {
    const fullPath = getSafePath(req.query.path);
    if (!fullPath) return res.sendStatus(403);
    res.send(fs.readFileSync(fullPath, 'utf8'));
});

// Dosya Kaydetme Rotosu
app.post('/api/file/save', (req, res) => {
    const fullPath = getSafePath(req.body.path);
    if (!fullPath) return res.sendStatus(403);
    fs.writeFileSync(fullPath, req.body.content, 'utf8');
    res.json({ success: true });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Buny Panel v2.0 http://localhost:${process.env.PORT || 3000} üzerinde aktif!`);
});
3. Kullanıcı Arayüzü (HTML/Tailwind)
📄 index.html
HTML
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8"><title>Buny Panel v2.0</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/socket.io/socket.io.js"></script>
    <style>body { background: #09090b; color: #fafafa; font-family: sans-serif; }</style>
</head>
<body class="h-screen flex flex-col overflow-hidden">
    <!-- Giriş Katmanı -->
    <div id="login" class="fixed inset-0 bg-zinc-950 z-50 flex items-center justify-center">
        <div class="bg-zinc-900 p-8 border border-zinc-800 rounded-lg w-80 shadow-2xl">
            <h2 class="text-xl font-bold mb-4 text-center">BUNY PANEL v2.0</h2>
            <input id="u" type="text" placeholder="Admin" class="w-full p-2 mb-2 bg-zinc-800 rounded border border-zinc-700 outline-none">
            <input id="p" type="password" placeholder="Şifre" class="w-full p-2 mb-4 bg-zinc-800 rounded border border-zinc-700 outline-none">
            <button onclick="auth()" class="w-full bg-white text-black py-2 font-bold rounded hover:bg-zinc-200 transition">Giriş Yap</button>
        </div>
    </div>

    <!-- Header -->
    <header class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <span class="text-xl font-black tracking-tighter uppercase italic">Buny Panel <span class="text-zinc-600 font-normal">v2.0</span></span>
        <nav class="flex gap-1">
            <button onclick="tab('console')" class="px-4 py-1 hover:bg-zinc-800 rounded transition">Console</button>
            <button onclick="tab('files')" class="px-4 py-1 hover:bg-zinc-800 rounded transition">Files</button>
            <button onclick="tab('players')" class="px-4 py-1 hover:bg-zinc-800 rounded transition">Players</button>
        </nav>
    </header>

    <main class="flex-1 p-6 overflow-auto">
        <!-- Console -->
        <section id="tab-console" class="tab h-full flex flex-col">
            <div id="out" class="flex-1 bg-zinc-900 border border-zinc-800 p-4 font-mono text-sm overflow-y-auto mb-2 text-zinc-400"></div>
            <input id="cmd" type="text" placeholder="Komut gönder..." class="w-full p-3 bg-zinc-900 border border-zinc-800 rounded outline-none focus:border-zinc-500">
        </section>

        <!-- Players -->
        <section id="tab-players" class="tab hidden">
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="p-4 bg-zinc-900 border border-zinc-800 rounded">Chunks: <span id="chunkCount" class="text-white font-bold">0</span></div>
                <div class="p-4 bg-zinc-900 border border-zinc-800 rounded">Limit (ms): <input id="pingLimit" type="number" value="300" class="bg-zinc-800 px-2 rounded w-16"></div>
            </div>
            <table class="w-full bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <thead class="bg-zinc-950 border-b border-zinc-800"><tr class="text-left"><th class="p-3 text-zinc-500">Oyuncu</th><th class="p-3 text-zinc-500">Ping</th></tr></thead>
                <tbody id="playerList" class="divide-y divide-zinc-800"></tbody>
            </table>
        </section>

        <!-- Files -->
        <section id="tab-files" class="tab hidden">
            <div class="flex items-center gap-4 mb-4">
                <button onclick="back()" class="px-3 py-1 bg-zinc-800 rounded text-sm">⬅ Geri</button>
                <span id="curPath" class="text-zinc-500 font-mono text-xs">/</span>
            </div>
            <div id="fileBrowser" class="space-y-1"></div>
        </section>
    </main>

    <!-- Editor Modal -->
    <div id="modal" class="fixed inset-0 bg-black/95 hidden flex-col p-6 z-[60]">
        <div class="flex justify-between items-center mb-4"><span id="edName" class="font-mono text-zinc-500"></span>
            <div class="flex gap-2">
                <button onclick="save()" class="bg-white text-black px-6 py-1 font-bold rounded">Kaydet</button>
                <button onclick="document.getElementById('modal').style.display='none'" class="text-zinc-500">Kapat</button>
            </div>
        </div>
        <textarea id="edText" class="flex-1 bg-zinc-950 p-6 font-mono text-zinc-300 border border-zinc-800 outline-none resize-none"></textarea>
    </div>

    <script>
        const socket = io();
        let curDir = "";

        function auth() {
            if (document.getElementById('u').value === 'admin' && document.getElementById('p').value === '123456') {
                document.getElementById('login').style.display = 'none';
                loadFiles();
            }
        }

        function tab(name) {
            document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
            document.getElementById('tab-' + name).classList.remove('hidden');
        }

        async function loadFiles() {
            document.getElementById('curPath').innerText = "/" + curDir;
            const res = await fetch('/api/files?dir=' + encodeURIComponent(curDir));
            const data = await res.json();
            const browser = document.getElementById('fileBrowser');
            browser.innerHTML = '';
            data.forEach(f => {
                const div = document.createElement('div');
                div.className = "p-3 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 cursor-pointer flex justify-between";
                div.innerHTML = `<span>${f.isDirectory ? '📁' : '📄'} ${f.name}</span>`;
                div.onclick = () => {
                    if (f.isDirectory) { curDir += (curDir ? "/" : "") + f.name; loadFiles(); }
                    else if (f.name.match(/\.(yml|properties|json|txt|log|xml)$/)) openFile(f.name);
                };
                browser.appendChild(div);
            });
        }

        function back() { if(!curDir) return; curDir = curDir.split('/').slice(0, -1).join('/'); loadFiles(); }

        async function openFile(name) {
            const path = curDir + (curDir ? "/" : "") + name;
            const res = await fetch('/api/file/read?path=' + encodeURIComponent(path));
            document.getElementById('edText').value = await res.text();
            document.getElementById('edName').innerText = path;
            document.getElementById('modal').style.display = 'flex';
        }

        async function save() {
            const path = document.getElementById('edName').innerText;
            const content = document.getElementById('edText').value;
            await fetch('/api/file/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({path, content})
            });
            alert('Dosya Kaydedildi!');
        }

        socket.on('live-data', d => {
            document.getElementById('chunkCount').innerText = d.chunks;
            const limit = parseInt(document.getElementById('pingLimit').value);
            document.getElementById('playerList').innerHTML = d.players.map(p => `
                <tr class="${p.ping > limit ? 'bg-red-950/20 text-red-500' : ''}">
                    <td class="p-3 font-bold">${p.name}</td>
                    <td class="p-3 font-mono">${p.ping}ms</td>
                </tr>
            `).join('');
        });

        document.getElementById('cmd').onkeypress = (e) => {
            if(e.key === 'Enter' && e.target.value) {
                socket.emit('send-command', e.target.value);
                document.getElementById('out').innerHTML += `<div><span class="text-zinc-600">></span> ${e.target.value}</div>`;
                e.target.value = '';
            }
        };
    </script>
</body>
</html>
4. Ngrok İnternete Açma Rehberi (Noktasına Kadar)
1. Ngrok Hesabı ve Token Alma
ngrok.com sitesine git ve kayıt ol.

Sol taraftaki menüden "Your Authtoken" sekmesine tıkla.

Oradaki uzun karakter dizisini (Token) kopyala.

2. Token'ı Tanımlama
Bilgisayarında bir terminal aç ve şu komutu yapıştır:

Bash
ngrok config add-authtoken <KOPYALADIGIN_TOKEN_BURAYA>
3. Paneli Dışarıya Açma (URL Alma)
Panelin server.js dosyasında belirlediğin port (varsayılan 3000) üzerinden tüneli başlat:

Bash
ngrok http 3000
Terminal ekranında çıkan "Forwarding" kısmındaki [https://...ngrok-free.app](https://...ngrok-free.app) linkini kopyala. Artık bu linkle dünyanın her yerinden paneline girebilirsin!

4. Minecraft Sunucusunu Açma (IP Alma)
Arkadaşlarının sunucuya girmesi için sunucu portunu (varsayılan 25565) TCP olarak aç:

Bash
ngrok tcp 25565
Burada çıkan 0.tcp.eu.ngrok.io:XXXXX adresini kopyala ve Minecraft'ta sunucu adresi olarak kullan.