// Pre-build script: Environment variables kontrolü
// Vercel build öncesi çalışır

console.log('🔍 Checking environment variables...');

const requiredVars = {
  'PRISMA_DATABASE_URL': 'Prisma Accelerate connection URL',
  'POSTGRES_URL': 'Direct PostgreSQL connection URL'
};

const optionalVars = {
  'COLLECTAPI_TOKEN': 'CollectAPI token for gold prices',
  'KV_REST_API_URL': 'Vercel KV URL (optional)'
};

let hasErrors = false;

// Required variables kontrolü
console.log('\n📋 Required Environment Variables:');
for (const [varName, description] of Object.entries(requiredVars)) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.error(`  ❌ ${varName}: MISSING - ${description}`);
    hasErrors = true;
  }
}

// Optional variables kontrolü
console.log('\n📋 Optional Environment Variables:');
for (const [varName, description] of Object.entries(optionalVars)) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set - ${description}`);
  }
}

if (hasErrors) {
  console.error('\n❌ Build will fail due to missing required environment variables!');
  console.error('Please add them in Vercel Dashboard → Settings → Environment Variables');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set. Proceeding with build...');
}

