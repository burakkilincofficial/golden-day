# Vercel Environment Variables Kurulum Rehberi

## 🚨 ÖNEMLİ: Build Hatası Çözümü

Eğer şu hatayı alıyorsanız:
```
❌ PRISMA_DATABASE_URL: MISSING
❌ POSTGRES_URL: MISSING
```

Bu rehberi takip edin.

## 📋 Adım Adım Kurulum

### 1. Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard adresine gidin
2. Projenizi seçin (golden-day)

### 2. Environment Variables Ekleme

1. **Settings** sekmesine tıklayın
2. **Environment Variables** sekmesine tıklayın
3. **Add New** butonuna tıklayın

### 3. Database URL Ekleme

**Seçenek A: Prisma Accelerate Kullanıyorsanız**

1. **Key:** `PRISMA_DATABASE_URL`
2. **Value:** Prisma Accelerate URL'iniz
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=...
   ```
3. **Environment:** 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
4. **Save**

**Seçenek B: Standart Vercel Postgres**

1. **Key:** `DATABASE_URL`
2. **Value:** Vercel Postgres connection string'iniz
   ```
   postgres://user:password@host:5432/database?sslmode=require
   ```
3. **Environment:** 
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Save**

### 4. Direct URL Ekleme (Migrations için)

1. **Key:** `POSTGRES_URL`
2. **Value:** Direct PostgreSQL connection string (migration'lar için)
   ```
   postgres://user:password@host:5432/database?sslmode=require
   ```
3. **Environment:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Save**

### 5. Vercel Postgres Otomatik Variables

Eğer Vercel Postgres oluşturduysanız, genellikle şu değişkenler **otomatik eklenir**:

- `POSTGRES_PRISMA_URL` (Connection Pooling)
- `POSTGRES_URL_NON_POOLING` (Direct Connection)

**Eğer bunlar yoksa:**

1. Vercel Dashboard → **Storage** sekmesi
2. Postgres database'inizi bulun
3. **.env.local** butonuna tıklayın
4. Environment variables'ları kopyalayın
5. **Settings → Environment Variables**'a ekleyin

### 6. CollectAPI Token (Opsiyonel)

1. **Key:** `COLLECTAPI_TOKEN`
2. **Value:** CollectAPI token'ınız
3. **Environment:** Production, Preview, Development
4. **Save**

## ✅ Kontrol Listesi

Environment Variables ekledikten sonra:

- [ ] `PRISMA_DATABASE_URL` veya `DATABASE_URL` eklendi
- [ ] `POSTGRES_URL` veya `POSTGRES_URL_NON_POOLING` eklendi
- [ ] Tüm environment'lar için seçildi (Production, Preview, Development)
- [ ] **Save** butonuna tıklandı
- [ ] Yeni deployment tetiklendi

## 🔄 Yeni Deployment

Environment variables ekledikten sonra:

1. **Deployments** sekmesine gidin
2. **Redeploy** butonuna tıklayın
3. Veya yeni bir commit push edin:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

## 🔍 Doğrulama

Build log'larında şunları görmelisiniz:

```
✅ Database URL: Set
✅ Direct URL: Set
✅ All required environment variables are set. Proceeding with build...
```

## ❓ Sorun Giderme

### "Environment variable not found" hatası devam ediyor

1. **Environment seçimini kontrol edin:**
   - Production ✅
   - Preview ✅
   - Development ✅
   - (Hepsini seçtiğinizden emin olun)

2. **Variable isimlerini kontrol edin:**
   - Büyük/küçük harf duyarlı
   - Boşluk olmamalı
   - Özel karakter olmamalı

3. **Value'yu kontrol edin:**
   - Tırnak işareti olmamalı
   - Başında/sonunda boşluk olmamalı

### Vercel Postgres variables otomatik eklenmedi

1. **Storage** → Postgres database'inize gidin
2. **.env.local** butonuna tıklayın
3. Variables'ları kopyalayın
4. **Settings → Environment Variables**'a manuel ekleyin

## 📞 Yardım

Eğer hala sorun yaşıyorsanız:

1. Vercel Dashboard → **Settings → Environment Variables** ekran görüntüsü alın (değerleri gizleyin)
2. Build log'larının tamamını paylaşın
3. Hangi environment variable'ları eklediğinizi belirtin

