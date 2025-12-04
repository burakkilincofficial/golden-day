# Vercel Build Sorun Giderme Rehberi

## 🔍 Build Hatası Nasıl Bulunur?

### 1. Vercel Dashboard'dan Log Kontrolü

1. **Vercel Dashboard** → Projeniz
2. **Deployments** sekmesi
3. Son deployment'a tıklayın
4. **View Function Logs** butonuna tıklayın
5. **Build Logs** sekmesine gidin
6. Hata mesajını arayın (kırmızı renkli)

### 2. Yaygın Hatalar ve Çözümleri

#### ❌ "Environment variable not found: PRISMA_DATABASE_URL"

**Çözüm:**
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `PRISMA_DATABASE_URL` ekleyin:
   - **Key:** `PRISMA_DATABASE_URL`
   - **Value:** Prisma Accelerate URL'iniz
   - **Environment:** Production, Preview, Development (hepsini seçin)
3. **Save** ve yeniden deploy edin

#### ❌ "Prisma Client not generated"

**Çözüm:**
1. `package.json`'da `postinstall` script'i var mı kontrol edin
2. Build log'larında "Prisma Client generated" görünmeli
3. Yoksa manuel olarak:
   ```bash
   npx prisma generate
   ```

#### ❌ "Cannot find module '@prisma/client'"

**Çözüm:**
1. `package.json`'da `@prisma/client` dependencies'de olmalı (devDependencies değil)
2. `npm install` çalıştırın
3. Commit edip push edin

#### ❌ "Table does not exist"

**Çözüm:**
İlk deploy'dan sonra database schema'yı oluşturun:
```bash
npx prisma db push
```

Vercel Dashboard'dan:
1. Deployments → Son deployment
2. View Function Logs
3. Terminal'de: `npx prisma db push`

#### ❌ Build timeout

**Çözüm:**
1. `next.config.mjs`'de `experimental.serverComponentsExternalPackages` ekleyin
2. Build script'ini optimize edin
3. Gereksiz dependencies'i kaldırın

## 📋 Checklist

Deploy öncesi kontrol:

- [ ] `PRISMA_DATABASE_URL` environment variable eklendi
- [ ] `POSTGRES_URL` environment variable eklendi
- [ ] `COLLECTAPI_TOKEN` environment variable eklendi (opsiyonel)
- [ ] `@prisma/client` dependencies'de (devDependencies değil)
- [ ] `prisma` devDependencies'de
- [ ] `postinstall` script'i `package.json`'da
- [ ] `build` script'i `prisma generate && next build` içeriyor
- [ ] `next.config.mjs`'de `serverComponentsExternalPackages` var

## 🔧 Manuel Test

Local'de test etmek için:

```bash
# Environment variables'ı kontrol et
node scripts/prebuild.js

# Prisma generate
npx prisma generate

# Build test
npm run build
```

## 📞 Destek

Eğer hata devam ederse:

1. **Tam hata mesajını** kopyalayın (Vercel Dashboard → Deployments → View Function Logs)
2. **Build log'larının tamamını** paylaşın
3. **Environment variables listesini** kontrol edin (değerleri paylaşmayın, sadece isimleri)

## 🎯 Hızlı Düzeltme

Eğer build sürekli başarısız oluyorsa:

1. **Tüm environment variables'ları silin ve yeniden ekleyin**
2. **Vercel Postgres'i yeniden oluşturun**
3. **Build cache'i temizleyin** (Vercel Dashboard → Settings → Clear Build Cache)
4. **Yeniden deploy edin**

