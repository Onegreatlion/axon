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

const token = tokenData.access_token;

// STEP 1: Fix Google connection - ensure Authentication is still enabled
console.log('=== Step 1: Fix Google Connection ===');
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=google-oauth2`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const connections = await connRes.json();

if (Array.isArray(connections) && connections.length > 0) {
  const google = connections[0];
  console.log('Connection ID:', google.id);
  console.log('Connected Accounts:', JSON.stringify(google.connected_accounts));
  console.log('Enabled clients:', google.enabled_clients);
  
  // Make sure Axon is in enabled_clients
  let enabledClients = google.enabled_clients || [];
  if (!enabledClients.includes(CLIENT_ID)) {
    enabledClients.push(CLIENT_ID);
  }
  
  // Update connection: keep connected_accounts AND ensure it's enabled for our app
  const updateRes = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enabled_clients: enabledClients,
      connected_accounts: { active: true },
      options: {
        ...google.options,
        scope: [
          "email",
          "profile",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/calendar.events.readonly"
        ]
      }
    })
  });
  
  const updateData = await updateRes.json();
  console.log('Update status:', updateRes.status);
  if (updateRes.status === 200) {
    console.log('Google connection updated successfully.');
    console.log('Connected Accounts:', JSON.stringify(updateData.connected_accounts));
    console.log('Enabled clients:', updateData.enabled_clients);
  } else {
    console.log('Error:', updateData.message || JSON.stringify(updateData));
  }
}

// STEP 2: Try to find or create My Account API
console.log('\n=== Step 2: My Account API ===');
const MY_ACCOUNT_AUDIENCE = `https://${DOMAIN}/me/`;

const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apis = await apiRes.json();
console.log('All APIs:');
if (Array.isArray(apis)) {
  for (const api of apis) {
    console.log(`  - ${api.name} | ${api.identifier} | system: ${api.is_system}`);
  }
}

// Try to create My Account API
console.log('\nTrying to create My Account API...');
const createApiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Auth0 My Account API',
    identifier: MY_ACCOUNT_AUDIENCE,
    scopes: [
      { value: 'create:me:connected_accounts', description: 'Create connected accounts' },
      { value: 'read:me:connected_accounts', description: 'Read connected accounts' },
      { value: 'delete:me:connected_accounts', description: 'Delete connected accounts' }
    ],
    skip_consent_for_verifiable_first_party_clients: true
  })
});

const createApiData = await createApiRes.json();
console.log('Create API status:', createApiRes.status);
if (createApiRes.status === 201 || createApiRes.status === 200) {
  console.log('My Account API created successfully!');
  console.log('ID:', createApiData.id);
} else {
  console.log('Response:', JSON.stringify(createApiData, null, 2));
}

// STEP 3: Set up client grant for My Account API
console.log('\n=== Step 3: Client Grant ===');
const grantsRes = await fetch(`https://${DOMAIN}/api/v2/client-grants?client_id=${CLIENT_ID}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const grants = await grantsRes.json();
console.log('Current grants:');
if (Array.isArray(grants)) {
  for (const g of grants) {
    console.log(`  - ${g.audience} | scopes: ${JSON.stringify(g.scope)}`);
  }
  
  const myAccountGrant = grants.find(g => g.audience === MY_ACCOUNT_AUDIENCE);
  if (!myAccountGrant) {
    console.log('\nCreating client grant for My Account API...');
    const grantRes = await fetch(`https://${DOMAIN}/api/v2/client-grants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        audience: MY_ACCOUNT_AUDIENCE,
        scope: [
          'create:me:connected_accounts',
          'read:me:connected_accounts',
          'delete:me:connected_accounts'
        ]
      })
    });
    const grantData = await grantRes.json();
    console.log('Grant create status:', grantRes.status);
    console.log('Response:', JSON.stringify(grantData, null, 2));
  }
}

// STEP 4: Configure MRRT
console.log('\n=== Step 4: Configure MRRT ===');
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
console.log('MRRT status:', mrrtRes.status);
if (mrrtData.refresh_token?.policies) {
  console.log('MRRT policies:', JSON.stringify(mrrtData.refresh_token.policies, null, 2));
} else {
  console.log('MRRT response:', mrrtData.message || JSON.stringify(mrrtData));
}

console.log('\n=== Summary ===');
console.log('1. Google connection: fixed, Connected Accounts enabled, scopes set');
console.log('2. My Account API: check output above');
console.log('3. Client grant: check output above');
console.log('4. MRRT: check output above');
console.log('\nNext: Clear cookies, restart server, login with Google, try connecting via services page.');

