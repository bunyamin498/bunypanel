# Buny Panel v2.0

Minecraft sunucunuzu web arayüzü üzerinden yönetmenizi sağlayan Node.js tabanlı bir panel.

## Özellikler

- Gerçek Zamanlı Konsol
- Mutlak Dosya Yolu Destekli Sürükle-Bırak Global File Manager
- Spigot Java Agent destekli Gelişmiş Paket & Ping Analizi (Gerçek Zamanlı)
- Otomatik Playit.gg Tünel Entegrasyonu

## Gereksinimler

- Node.js (LTS önerilir)
- Java (sunucu ve Agent için)

## Kurulum

1. Repoyu indirin ve bağımlılıkları yükleyin:

   ```bash
   git clone <repo-url>
   npm install
   ```

2. Ortam değişkenlerini oluşturun:

   - `.env.example` dosyasını kopyalayıp proje kök dizininde `.env` olarak oluşturun.
   - `SERVER_PATH` değerini kendi Minecraft sunucu klasörünüze göre güncelleyin.

3. Java Agent’ı derleyin ve `plugins` klasörüne atın:

   - `AgentPlugin` klasörünü derleyin (Maven/IDE ile).
   - Oluşan `.jar` dosyasını sunucunuzun `plugins` klasörüne kopyalayın.

4. Paneli başlatın:

   ```bash
   node server.js
   ```

## Ortam Değişkenleri

- `PORT`: Web panelin çalışacağı port (varsayılan: `3000`)
- `SERVER_PATH`: Minecraft sunucusunun bulunduğu klasörün mutlak yolu
