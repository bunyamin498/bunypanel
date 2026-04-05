# 🚀 Buny Panel v2.0

Modern, gerçek zamanlı ve güvenli bir **Minecraft Server Yönetim Paneli**
(Node.js + Socket.io + Java Agent)

---

## 📸 Görseller

![Panel Görsel 1](https://i.ibb.co/4n0hC5zL/image.png)
![Panel Görsel 2](https://i.ibb.co/wFPPr2P3/image.png)

---

## ✨ Özellikler

* ⚡ Gerçek zamanlı veri akışı
* 📂 Güvenli dosya yöneticisi
* 🖥️ Modern web arayüz
* 👥 Oyuncu ping takibi
* 💻 Konsol komut sistemi
* 🔌 Java Agent entegrasyonu
* 🌍 Ngrok ile dış erişim

---

## 📁 Proje Yapısı

```
BunyPanel/
│
├── server.js
├── index.html
├── .env
├── .gitignore
├── AgentPlugin/   # Java Plugin (AYRI)
└── README.md
```

---

## ⚙️ Kurulum

### 1. Gereksinimler

* Node.js (v16+)
* Java 17+ (Plugin için)
* Minecraft Server (Spigot / Paper önerilir)

---

### 2. Paketleri Kur

```bash
npm install express socket.io dotenv
```

---

### 3. .env Dosyası

```env
SERVER_PATH=C:/MinecraftSunucum/
PORT=3000
```

---

### 4. Paneli Başlat

```bash
node server.js
```

Tarayıcı:

```
http://localhost:3000
```

---

## 🔐 Giriş

```
Kullanıcı: admin
Şifre:    123456
```

> ⚠️ Production’da değiştir

---

# 🔌 Java Agent Plugin (KRİTİK)

Bu panelin çalışması için Minecraft tarafında **Agent Plugin** olması gerekir.

Bu plugin:

* 📊 Chunk sayısını gönderir
* 👥 Oyuncu listesini gönderir
* 📡 Ping bilgilerini iletir
* 🔄 Veriyi sürekli backend’e yollar

---

## 📡 Agent → Panel Veri Akışı

```
Minecraft Server → Java Plugin → HTTP POST → Node.js → Socket.io → Panel
```

---

## 📨 Veri Gönderme Endpoint

Plugin şu endpoint’e veri yollar:

```
POST /api/server-data
```

---

## 📦 Örnek JSON

```json
{
  "chunks": 1200,
  "players": [
    { "name": "bunyaminpalt", "ping": 45 },
    { "name": "player2", "ping": 320 }
  ]
}
```

---

## ⚙️ Plugin Kurulumu

1. Plugin `.jar` dosyasını al
2. Minecraft sunucunun:

```
/plugins/
```

klasörüne at

3. Sunucuyu başlat

---

## 🔒 Güvenlik

* Path traversal koruması vardır
* Sunucu dışı erişim engellenir
* Dosya erişimi kontrollüdür
* `.env` gizlidir

---

## 📡 API

### Veri Alma

```
POST /api/server-data
```

### Dosya Listeleme

```
GET /api/files?dir=
```

### Dosya Okuma

```
GET /api/file/read?path=
```

### Dosya Kaydetme

```
POST /api/file/save
```

```json
{
  "path": "config.yml",
  "content": "yeni içerik"
}
```

---

## 🌍 Ngrok ile Açma

### Token ekle

```bash
ngrok config add-authtoken TOKEN
```

---

### Panel

```bash
ngrok http 3000
```

---

### Minecraft

```bash
ngrok tcp 25565
```

---

## 🧠 Sistem Mantığı

```
Java Plugin → Backend → Web Panel
```

---

## 🛠️ Geliştirme

* 🔐 JWT login sistemi ekle
* 📊 Grafik panel (CPU / RAM)
* 📜 Log sistemi
* 🛡️ Rate limit (DDOS koruma)
* 🌐 Domain + SSL

---

## ⚠️ Uyarı

* Production için tam güvenli değil
* Şifreyi değiştir
* Ngrok linkini paylaşma

---

## 👑 Geliştirici

bunyaminpalt

---

## 📜 Lisans

Kişisel kullanım içindir.
