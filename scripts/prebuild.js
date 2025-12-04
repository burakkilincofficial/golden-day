// Pre-build script: Environment variables kontrolü
// Vercel build öncesi çalışır

console.log('🔍 Checking environment variables...');

// Database URL kontrolü - birden fazla olası isim
// Öncelik: DATABASE_URL > POSTGRES_PRISMA_URL > PRISMA_DATABASE_URL
const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PRISMA_DATABASE_URL;

const directUrl = 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING;

let hasErrors = false;

// Database connection kontrolü
console.log('\n📋 Database Connection Variables:');
if (databaseUrl) {
  console.log(`  ✅ Database URL: Set (${databaseUrl.substring(0, 30)}...)`);
  // Hangi variable kullanıldığını göster
  if (process.env.PRISMA_DATABASE_URL) {
    console.log('     Kullanılan: PRISMA_DATABASE_URL (Prisma Accelerate)');
  } else if (process.env.DATABASE_URL) {
    console.log('     Kullanılan: DATABASE_URL');
  } else if (process.env.POSTGRES_PRISMA_URL) {
    console.log('     Kullanılan: POSTGRES_PRISMA_URL');
  }
} else {
  console.error('  ❌ Database URL: MISSING');
  console.error('     Gerekli: DATABASE_URL (veya POSTGRES_PRISMA_URL, PRISMA_DATABASE_URL)');
  console.error('     Vercel Dashboard → Settings → Environment Variables');
  hasErrors = true;
}

if (directUrl) {
  console.log(`  ✅ Direct URL: Set (${directUrl.substring(0, 30)}...)`);
} else {
  console.warn('  ⚠️  Direct URL: Not set (migrations için gerekli olabilir)');
  console.warn('     Olası isimler: POSTGRES_URL, POSTGRES_URL_NON_POOLING');
}

// Optional variables kontrolü
console.log('\n📋 Optional Environment Variables:');
const optionalVars = {
  'COLLECTAPI_TOKEN': 'CollectAPI token for gold prices',
  'KV_REST_API_URL': 'Vercel KV URL (optional)'
};

for (const [varName, description] of Object.entries(optionalVars)) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set - ${description}`);
  }
}

if (hasErrors) {
  console.error('\n❌ Build will fail due to missing required environment variables!');
  console.error('\n📝 Vercel\'de Environment Variables eklemek için:');
  console.error('   1. Vercel Dashboard → Projeniz → Settings → Environment Variables');
  console.error('   2. Add New butonuna tıklayın');
  console.error('   3. Key: DATABASE_URL (veya POSTGRES_PRISMA_URL)');
  console.error('   4. Value: Vercel Postgres connection string');
  console.error('   5. Environment: Production, Preview, Development (hepsini seçin)');
  console.error('   6. Save');
  console.error('\n   Vercel Postgres oluşturduysanız, genellikle şunlar otomatik eklenir:');
  console.error('   - POSTGRES_PRISMA_URL');
  console.error('   - POSTGRES_URL_NON_POOLING');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set. Proceeding with build...');
}

