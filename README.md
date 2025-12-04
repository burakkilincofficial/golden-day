# 🪙 GoldDay Manager

Altın Günü yönetim sistemi - Next.js 14 ile geliştirilmiş modern web uygulaması.

## ✨ Özellikler

- 📊 **Güncel Altın Fiyatları**: CollectAPI ile gerçek zamanlı altın fiyatları (Gram, Çeyrek, Yarım, Tam)
- 👥 **Üye Yönetimi**: Üye ekleme, silme ve düzenleme
- 🎲 **Kura Çekme**: Adil ve şeffaf kura çekme sistemi
- 📅 **12 Aylık Takip**: Her üye için aylık ev sahipliği ve ödeme takibi
- 💾 **Database Entegrasyonu**: Vercel Postgres ile veri saklama
- 📥 **Excel Export**: Kura çekimi sonuçlarını Excel olarak indirme

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Vercel hesabı (production için)

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 📦 Teknolojiler

- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **State Management**: Zustand
- **Database**: Vercel Postgres + Prisma ORM
- **Excel Export**: xlsx

## 🔧 Environment Variables

`.env.local` dosyası oluşturun:

```env
# Database (Vercel Postgres)
DATABASE_URL=your_database_url
POSTGRES_URL=your_postgres_url

# CollectAPI (Altın fiyatları için)
COLLECTAPI_TOKEN=your_collectapi_token
```

## 📋 Vercel Deployment

### 1. Vercel Postgres Oluşturma

1. Vercel Dashboard → Projeniz → **Storage**
2. **Create Database** → **Postgres**
3. Database adını girin ve oluşturun
4. `DATABASE_URL` ve `POSTGRES_URL` otomatik eklenir

### 2. CollectAPI Token

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `COLLECTAPI_TOKEN` ekleyin
3. Production, Preview, Development için seçin

### 3. İlk Deploy

```bash
git push origin main
```

Vercel otomatik deploy edecek. İlk deploy sonrası database schema otomatik oluşturulur.

## 🎯 Kullanım

1. **Üye Ekleme**: "Üye Ekle" butonuna tıklayın ve üye ismini girin
2. **Kura Çekme**: "Kura Çek" butonuna tıklayın - her üye sırayla bir kez gelecek
3. **Ödeme Takibi**: Tabloda checkbox'ları işaretleyerek ödeme durumunu güncelleyin
4. **Excel Export**: "Excel İndir" butonuna tıklayarak sonuçları indirin

## 📊 Altın Fiyatları

- **API**: CollectAPI (günlük 3 istek limiti)
- **İstek Saatleri**: 08:00, 12:00, 16:00 (Türkiye saati)
- **Cache**: Database'de saklanır, gün içinde tekrar istek atılmaz

## 🗄️ Database Schema

- **groups**: Altın Günü grupları
- **members**: Üyeler
- **month_trackings**: Aylık takipler
- **payments**: Ödeme kayıtları
- **gold_price_cache**: Altın fiyatı cache

## 📝 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Database
npm run db:push      # Schema'yı push et
npm run db:studio    # Prisma Studio aç
npm run db:generate  # Prisma Client generate et
```

## 🐛 Sorun Giderme

### "Table does not exist" hatası
```bash
npm run db:push
```

### "Prisma Client not found" hatası
```bash
npm run db:generate
```

### Build hatası
- Environment variables'ları kontrol edin
- `DATABASE_URL` ve `POSTGRES_URL` Vercel'de ekli mi?

## 📄 Lisans

MIT

