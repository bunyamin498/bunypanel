# 📦 Buny Panel v2.0

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-LTS-green.svg)
![Java](https://img.shields.io/badge/Java-17%2B-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Minecraft sunucunuzu web arayüzü üzerinden tam yetkiyle yönetmenizi sağlayan Node.js tabanlı, modern, siyah-beyaz (monochrome) ve fütüristik bir kontrol paneli. Sunucunuzun arka planında çalışan sistemleri tek bir ekranda birleştirerek hem dosya yönetimini hem de performans takibini kolaylaştırır.

---

## 📸 Ekran Görüntüleri
*(Not: Bu kısımlara proje fotoğraflarınızı sürükleyip bırakarak yükleyebilirsiniz)*

<details>
  <summary>Görselleri Göster / Gizle</summary>
  
  - **Ana Dashboard / Konsol:** `[Buraya ekran görüntüsü gelecek]`
  - **Dosya Yöneticisi (File Manager):** `[Buraya ekran görüntüsü gelecek]`
  - **Gelişmiş Analiz:** `[Buraya ekran görüntüsü gelecek]`
</details>

---

## ✨ Detaylı Özellikler

*   💻 **Gerçek Zamanlı Konsol:** Minecraft sunucunuzun loglarını tarayıcı üzerinden saniyesi saniyesine izleyin. Anında yetkili komutları gönderin.
*   📁 **Global File Manager (Tam Erişim):** 
    *   Sunucunun mutlak yoluna (Absolute Path) doğrudan bağlanır.
    *   **Sürükle & Bırak:** Eklenti (`.jar`) yüklemek için dosyayı ekrana fırlatmanız yeterli.
    *   **Dahili Kod Editörü:** `server.properties`, `spigot.yml` veya `ops.json` dosyalarını indirmeden panel üzerinden tıklayarak düzenleyin ve kaydedin.
*   📊 **Spigot Java Agent (Gelişmiş Veri Analizi):** 
    *   Backend ile senkronize çalışan özel Java eklentisi sayesinde oyuncuların **anlık ping** değerlerini takip edin.
    *   Haritada yoğunluk ve lag yaratan **ağır chunk'ları ve entity sayılarını** tespit edin.
    *   Özelleştirilebilir "Max Ping" ve "Max Paket" limitleriyle şüpheli durumları anında yakalayın.
*   🌐 **Otomatik Playit.gg ve Ngrok Entegrasyonu:** Modemden port açma (Port Forwarding) derdine son. Tek komutla sunucunuzu dış dünyaya açın.
*   🎨 **Modern UI/UX:** Tailwind CSS ile kodlanmış, göz yormayan karanlık tema ve pürüzsüz animasyon geçişleri.

---

## 🛠️ Gereksinimler

Sistemin sorunsuz çalışması için ortamınızda şunların kurulu olması gerekir:
*   [Node.js](https://nodejs.org/) (LTS sürümü tavsiye edilir)
*   **Java 17 veya üzeri** (Minecraft sunucusu ve Agent eklentisi için)
*   **Spigot / Paper** tabanlı bir Minecraft Sunucusu

---

## 🚀 Kurulum Adımları

### 1. Dosyaları İndirin
Projeyi bilgisayarınıza klonlayın ve bağımlılıkları kurun:
```bash
git clone [https://github.com/bunyamin498/bunypanel.git](https://github.com/bunyamin498/bunypanel.git)
cd bunypanel
npm install