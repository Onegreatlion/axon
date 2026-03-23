import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}='([^']*)'`));
  return match ? match[1] : null;
};

const DOMAIN = getEnv('AUTH0_DOMAIN');
const CLIENT_ID = getEnv('AUTH0_CLIENT_ID');
const CLIENT_SECRET = getEnv('AUTH0_CLIENT_SECRET');

// Get management token
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
  console.log('Failed to get token:', tokenData);
  process.exit(1);
}

const token = tokenData.access_token;

// Check tenant flags
console.log('=== TENANT SETTINGS ===');
const tenantRes = await fetch(`https://${DOMAIN}/api/v2/tenants/settings`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const tenant = await tenantRes.json();
console.log('Flags:', JSON.stringify(tenant.flags, null, 2));
console.log('');

// Check Google connection details
console.log('=== GOOGLE CONNECTION ===');
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=google-oauth2`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const connections = await connRes.json();
if (connections.length > 0) {
  const google = connections[0];
  console.log('Name:', google.name);
  console.log('ID:', google.id);
  console.log('Connected Accounts:', JSON.stringify(google.connected_accounts));
  console.log('Options scopes:', JSON.stringify(google.options?.scope));
  
  // Try to enable connected_accounts on the connection
  console.log('\n=== TRYING TO ENABLE CONNECTED ACCOUNTS ===');
  const updateRes = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      connected_accounts: { active: true }
    })
  });
  const updateData = await updateRes.json();
  console.log('Status:', updateRes.status);
  console.log('Response:', JSON.stringify(updateData.connected_accounts || updateData.message || updateData, null, 2));
}

// Check client app settings
console.log('\n=== APP SETTINGS ===');
const appRes = await fetch(`https://${DOMAIN}/api/v2/clients/${CLIENT_ID}?fields=name,grant_types,refresh_token`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const app = await appRes.json();
console.log('Name:', app.name);
console.log('Grant Types:', app.grant_types);
console.log('Refresh Token Config:', JSON.stringify(app.refresh_token, null, 2));

// Check resource servers (APIs)
console.log('\n=== APIs ===');
const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apis = await apiRes.json();
for (const api of apis) {
  console.log(`- ${api.name} (${api.identifier})`);
}

// Try My Account API
console.log('\n=== MY ACCOUNT API CHECK ===');
const myAccountRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers?identifier=${encodeURIComponent(`https://${DOMAIN}/me/`)}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const myAccount = await myAccountRes.json();
console.log('My Account API:', JSON.stringify(myAccount, null, 2));

