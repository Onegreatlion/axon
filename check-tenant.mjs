import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}='([^']*)'`));
  return match ? match[1] : null;
};

const DOMAIN = getEnv('AUTH0_DOMAIN');
const CLIENT_ID = getEnv('AUTH0_CLIENT_ID');
const CLIENT_SECRET = getEnv('AUTH0_CLIENT_SECRET');

const tokenRes = await fetch(`https://${DOMAIN}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience: `https://${DOMAIN}/api/v2/`
  })
});

const tokenData = await tokenRes.json();

if (!tokenData.access_token) {
  console.log('Failed:', tokenData);
  process.exit(1);
}

// Check tenant settings
const tenantRes = await fetch(`https://${DOMAIN}/api/v2/tenants/settings`, {
  headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
});

const tenantData = await tenantRes.json();
console.log('Tenant flags:', JSON.stringify(tenantData.flags, null, 2));

// Check connections
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections`, {
  headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
});

const connData = await connRes.json();
console.log('\nConnections:');
for (const conn of connData) {
  console.log(`  - ${conn.name} (${conn.strategy})`);
}
