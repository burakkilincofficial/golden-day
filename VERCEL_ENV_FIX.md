# Vercel Environment Variables Düzeltme

## 🔧 Sorun

Vercel'de environment variables isimleri Prisma schema ile uyuşmuyor.

## ✅ Çözüm

Vercel Dashboard'da şu environment variables'ları ekleyin veya mevcut olanları mapping yapın:

### 1. Prisma Accelerate Kullanıyorsanız (Önerilen)

Eğer `PRISMA_DATABASE_URL` kullanıyorsanız, schema zaten bunu kullanıyor. Sadece `POSTGRES_URL` ekleyin:

**Vercel Dashboard → Settings → Environment Variables:**

1. **PRISMA_DATABASE_URL** (Zaten var)
   - Value: Mevcut değeriniz
   - Environment: Production, Preview, Development

2. **POSTGRES_URL** (Zaten var - directUrl için)
   - Value: Mevcut değeriniz
   - Environment: Production, Preview, Development

### 2. Standart Vercel Postgres Kullanıyorsanız

Eğer Prisma Accelerate kullanmıyorsanız, schema'yı güncelleyin:

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("POSTGRES_URL")
}
```

**Vercel Dashboard → Settings → Environment Variables:**

1. **DATABASE_URL**
   - Value: `postgres://9a2f5d2e3e057ef6898d98af6a43b5003f5f8a7a893a2de54902c0ec8a40807b:sk_m3ScwzRX8wawFRe4v5E52@db.prisma.io:5432/postgres?sslmode=require`
   - Environment: Production, Preview, Development

2. **POSTGRES_URL** (Zaten var)
   - Value: Mevcut değeriniz
   - Environment: Production, Preview, Development

### 3. Vercel Postgres Otomatik Variables (Önerilen)

Vercel Postgres oluşturulduğunda genellikle şu değişkenler otomatik eklenir:
- `POSTGRES_PRISMA_URL` (Connection Pooling)
- `POSTGRES_URL_NON_POOLING` (Direct Connection)

Eğer bunlar yoksa, Vercel Postgres'i yeniden oluşturun veya manuel ekleyin.

## 🎯 Hızlı Çözüm (Şu An İçin)

Mevcut environment variables'larınızı kullanmak için schema'yı şu şekilde güncelleyin:

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("PRISMA_DATABASE_URL")  // Prisma Accelerate
  directUrl = env("POSTGRES_URL")        // Direct connection
}
```

Bu şekilde mevcut environment variables'larınız çalışacak.

## 📝 Notlar

- **Prisma Accelerate:** `PRISMA_DATABASE_URL` kullanıyorsanız, bu Prisma'nın managed connection pooling servisidir. Daha hızlı ve ölçeklenebilir.
- **Standart Vercel Postgres:** `DATABASE_URL` veya `POSTGRES_PRISMA_URL` kullanın.
- **Direct URL:** Migration'lar için `POSTGRES_URL` veya `POSTGRES_URL_NON_POOLING` gerekli.

## 🔍 Kontrol

Deploy sonrası build loglarını kontrol edin:
- ✅ "Prisma Client generated" görünmeli
- ❌ "Environment variable not found" hatası olmamalı

