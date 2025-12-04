# Database Kurulum Rehberi

## Önemli Notlar ⚠️

1. **Herkes Aynı Veriyi Görür**: Database'deki veriler tüm kullanıcılar tarafından paylaşılır. Bir kullanıcı üye eklediğinde, tüm kullanıcılar görebilir.

2. **Server-Side Storage**: Veriler browser'da (localStorage) değil, Vercel Postgres database'de saklanır.

3. **Real-time Updates**: Şu anda sayfa yenileme ile güncellenir. İleride WebSocket veya polling eklenebilir.

## 1. Vercel Postgres Kurulumu

### Adımlar:
1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Storage** sekmesine gidin
4. **Create Database** → **Postgres** seçin
5. Database adını girin (örn: `gold-day-db`)
6. **Create** butonuna tıklayın

### Environment Variables (Otomatik Eklenir):
Vercel Postgres oluşturulduğunda şu değişkenler otomatik eklenir:
- `POSTGRES_PRISMA_URL` (Connection Pooling URL)
- `POSTGRES_URL_NON_POOLING` (Direct Connection URL)

## 2. Local Development için .env.local

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
# Vercel Postgres (local'de çalışmaz, sadece production'da)
# Production'da Vercel otomatik ekler
POSTGRES_PRISMA_URL=your_postgres_url_here
POSTGRES_URL_NON_POOLING=your_postgres_direct_url_here

# CollectAPI Token
COLLECTAPI_TOKEN=your_collectapi_token_here
```

**Not:** Local development için Vercel Postgres'e bağlanamazsınız. Local'de test etmek için:
- Vercel'e deploy edin
- Veya local PostgreSQL kullanın (schema aynı)

## 3. Prisma Setup

### İlk Kurulum:
```bash
# Prisma client'ı generate et
npm run db:generate

# Database schema'yı push et (Vercel'de otomatik yapılır)
npm run db:push
```

### Database Studio (Opsiyonel):
```bash
# Prisma Studio'yu aç (local database için)
npm run db:studio
```

## 4. Database Schema

### Tablolar:
- **groups**: Altın Günü grupları (şimdilik tek grup)
- **members**: Üyeler
- **month_trackings**: Aylık takipler (12 ay)
- **payments**: Ödeme kayıtları

### İlişkiler:
- Bir grup → Çok üye
- Bir grup → Çok aylık takip
- Bir üye → Çok ödeme
- Bir aylık takip → Çok ödeme
- Bir üye → Çok ev sahipliği (aylık takiplerde)

## 5. Deploy

```bash
# Git'e push edin
git add .
git commit -m "Database entegrasyonu eklendi"
git push

# Vercel otomatik deploy edecek
# veya manuel:
vercel --prod
```

## 6. İlk Kullanım

1. Sayfa ilk açıldığında otomatik olarak varsayılan grup oluşturulur
2. Üye ekleyin
3. "Kura Çek" butonuna tıklayın
4. 12 aylık takip otomatik oluşturulur

## Özellikler

- ✅ **Shared State**: Tüm kullanıcılar aynı veriyi görür
- ✅ **Server-Side Storage**: Veriler database'de saklanır
- ✅ **Automatic Sync**: Sayfa yenileme ile senkronize olur
- ✅ **Cascade Delete**: Üye silindiğinde ödemeleri de silinir
- ✅ **Unique Constraints**: Aynı isimde iki üye olamaz

## Sorun Giderme

### "Prisma Client not found" hatası:
```bash
npm run db:generate
```

### "Database connection failed" hatası:
- Vercel'de environment variables'ları kontrol edin
- `POSTGRES_PRISMA_URL` ve `POSTGRES_URL_NON_POOLING` ekli mi?

### "Table does not exist" hatası:
```bash
npm run db:push
```

