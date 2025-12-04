// Environment variables kontrol script'i
// Build öncesi kontrol için

const requiredVars = [
  'PRISMA_DATABASE_URL',
  'POSTGRES_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('⚠️  Build will continue but database connection may fail.');
  console.warn('⚠️  Make sure to add these in Vercel Dashboard → Settings → Environment Variables');
} else {
  console.log('✅ All required environment variables are set');
}

