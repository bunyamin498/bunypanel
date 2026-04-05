# 🚀 Buny Panel v2.0

Modern, gerçek zamanlı ve güvenli bir **Minecraft Server Yönetim Paneli**
(Node.js + Socket.io + Tailwind CSS)

---

## ✨ Özellikler

* ⚡ Gerçek zamanlı veri akışı
* 📂 Güvenli dosya yöneticisi (path korumalı)
* 🖥️ Modern web arayüz
* 👥 Oyuncu ping takibi
* 💻 Konsol komut sistemi
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
└── README.md
```

---

## ⚙️ Kurulum

### 1. Gereksinimler

* Node.js (v16+)
* npm

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

### 4. Sunucuyu Başlat

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

> ⚠️ Değiştirmen önerilir

---

## 🔒 Güvenlik

* Path traversal koruması var
* Sunucu dışına çıkılamaz
* .env gizli tutulur
* Sadece belirli dosyalar açılır

---

## 📡 API

### Veri Gönderme

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

## 🌍 Ngrok Kurulum

### Token ekle

```bash
ngrok config add-authtoken TOKEN
```

### Paneli aç

```bash
ngrok http 3000
```

### Minecraft aç

```bash
ngrok tcp 25565
```

---

## 🧠 Sistem

```
Java Agent → Node.js → Socket.io → Panel
```

---

## 🛠️ Geliştirme

* JWT login sistemi ekle
* Rate limit ekle
* Log sistemi geliştir
* Grafik panel (CPU/RAM)
* Nginx / Cloudflare ile koru

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
