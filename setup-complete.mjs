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
  console.log('Failed to get token:', tokenData);
  process.exit(1);
}

const token = tokenData.access_token;
const MY_ACCOUNT_AUDIENCE = `https://${DOMAIN}/me/`;

// Step 1: Check My Account API
console.log('=== Step 1: My Account API ===');
const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apis = await apiRes.json();
const myAccountApi = Array.isArray(apis) 
  ? apis.find(a => a.identifier === MY_ACCOUNT_AUDIENCE || a.identifier?.includes('/me'))
  : null;

if (myAccountApi) {
  console.log('My Account API found:', myAccountApi.name);
  console.log('Identifier:', myAccountApi.identifier);
} else {
  console.log('My Account API NOT found in APIs list.');
  console.log('Available APIs:');
  if (Array.isArray(apis)) {
    apis.forEach(a => console.log(`  - ${a.name} (${a.identifier})`));
  }
}

// Step 2: Configure MRRT with My Account API
console.log('\n=== Step 2: Configure MRRT ===');
const mrrtRes = await fetch(`https://${DOMAIN}/api/v2/clients/${CLIENT_ID}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refresh_token: {
      expiration_type: "non-expiring",
      leeway: 0,
      infinite_token_lifetime: true,
      infinite_idle_token_lifetime: true,
      token_lifetime: 31557600,
      idle_token_lifetime: 2592000,
      rotation_type: "non-rotating",
      policies: [
        {
          audience: MY_ACCOUNT_AUDIENCE,
          scope: [
            "create:me:connected_accounts",
            "read:me:connected_accounts",
            "delete:me:connected_accounts"
          ]
        }
      ]
    }
  })
});

const mrrtData = await mrrtRes.json();
console.log('MRRT update status:', mrrtRes.status);
if (mrrtData.refresh_token) {
  console.log('MRRT policies:', JSON.stringify(mrrtData.refresh_token.policies, null, 2));
} else {
  console.log('MRRT error:', mrrtData.message || JSON.stringify(mrrtData));
}

// Step 3: Verify Google connection
console.log('\n=== Step 3: Google Connection ===');
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=google-oauth2`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const connections = await connRes.json();
if (Array.isArray(connections) && connections.length > 0) {
  const google = connections[0];
  console.log('Connected Accounts:', JSON.stringify(google.connected_accounts));
  console.log('Scopes:', google.options?.scope);
}

// Step 4: Verify app grant types
console.log('\n=== Step 4: Grant Types ===');
const appRes = await fetch(`https://${DOMAIN}/api/v2/clients/${CLIENT_ID}?fields=grant_types`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const appData = await appRes.json();
console.log('Grant types:', appData.grant_types);

// Step 5: Check client grants for My Account API
console.log('\n=== Step 5: Client Grants ===');
const grantsRes = await fetch(`https://${DOMAIN}/api/v2/client-grants?client_id=${CLIENT_ID}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const grantsText = await grantsRes.text();
try {
  const grants = JSON.parse(grantsText);
  if (Array.isArray(grants)) {
    for (const g of grants) {
      console.log(`- Audience: ${g.audience}, Scopes: ${JSON.stringify(g.scope)}`);
    }
    
    // Check if My Account API grant exists
    const myAccountGrant = grants.find(g => g.audience === MY_ACCOUNT_AUDIENCE);
    if (!myAccountGrant) {
      console.log('\nCreating client grant for My Account API...');
      const createRes = await fetch(`https://${DOMAIN}/api/v2/client-grants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          audience: MY_ACCOUNT_AUDIENCE,
          scope: [
            "create:me:connected_accounts",
            "read:me:connected_accounts",
            "delete:me:connected_accounts"
          ]
        })
      });
      const createData = await createRes.json();
      console.log('Create grant status:', createRes.status);
      console.log('Response:', JSON.stringify(createData, null, 2));
    } else {
      console.log('My Account API grant already exists.');
    }
  } else {
    console.log('Grants response:', grantsText);
  }
} catch (e) {
  console.log('Grants raw:', grantsText);
}

console.log('\n=== Setup Complete ===');
console.log('Next: Clear cookies, restart server, login, then try connecting Google via the services page.');

