# Production API Key Hatası Düzeltme

## 🔴 Sorun

Production'da hata:
```
The provided API Key is invalid. Reason: Validation of API Key failed.
```

Bu hata, Prisma Accelerate API key'inin geçersiz olduğunu veya hala kullanıldığını gösterir.

## ✅ Çözüm: Standart Vercel Postgres Kullanın

### Adım 1: Vercel Postgres Oluşturun

1. **Vercel Dashboard** → Projeniz → **Storage**
2. **Create Database** → **Postgres**
3. Database adını girin (örn: `golden-day-db`)
4. **Create**

**✅ Otomatik eklenen variables:**
- `DATABASE_URL` (Connection Pooling)
- `POSTGRES_URL` (Direct Connection)

### Adım 2: Environment Variables Kontrolü

1. **Settings** → **Environment Variables**
2. Şunları kontrol edin:
   - ✅ `DATABASE_URL` (Vercel Postgres - otomatik eklenir)
   - ✅ `POSTGRES_URL` (Direct connection - otomatik eklenir)
   - ⚠️ `PRISMA_DATABASE_URL` (varsa silebilirsiniz - artık kullanılmıyor)

### Adım 3: Prisma Schema'yı Kontrol Edin

Schema artık `DATABASE_URL` kullanıyor:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("POSTGRES_URL")
}
```

### Adım 4: Database Schema'yı Oluşturun

İlk deploy'dan sonra:

1. **Deployments** → Son deployment → **View Function Logs**
2. Terminal'de:
```bash
npx prisma db push
```

Veya Vercel CLI ile:
```bash
vercel env pull .env.local
npx prisma db push
```

### Adım 5: Redeploy

1. **Deployments** → Son deployment → **Redeploy**
2. Veya yeni commit:
```bash
git add .
git commit -m "Use standard Vercel Postgres (DATABASE_URL)"
git push
```

## 🔍 Doğrulama

Deploy sonrası:
1. Sayfayı açın
2. "Üye Ekle" butonuna tıklayın
3. Bir isim girin ve ekleyin
4. ✅ Hata olmamalı

## ⚠️ Önemli Notlar

- **Prisma Accelerate'e gerek yok** - Standart Vercel Postgres yeterli
- `DATABASE_URL` Vercel Postgres oluşturulduğunda **otomatik eklenir**
- Eğer `PRISMA_DATABASE_URL` kullanıyorsanız, geçersiz API key hatası alırsınız
- Schema artık `DATABASE_URL` kullanıyor, Prisma Accelerate değil

## 📋 Checklist

- [ ] Vercel Postgres oluşturuldu
- [ ] `DATABASE_URL` environment variable eklendi (otomatik)
- [ ] `POSTGRES_URL` environment variable eklendi (otomatik)
- [ ] `PRISMA_DATABASE_URL` silindi (opsiyonel - artık kullanılmıyor)
- [ ] Yeni commit push edildi
- [ ] Database schema oluşturuldu (`prisma db push`)
- [ ] Test edildi - üye ekleme çalışıyor

