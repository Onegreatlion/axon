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
const MY_ACCOUNT = `https://${DOMAIN}/me/`;

// Attempt 1: Create without scopes
console.log('=== Attempt 1: Create My Account API (no scopes) ===');
const res1 = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Auth0 My Account API',
    identifier: MY_ACCOUNT
  })
});
const data1 = await res1.json();
console.log('Status:', res1.status);
console.log('Response:', JSON.stringify(data1, null, 2));

// Attempt 2: Try just the identifier
if (res1.status !== 201 && res1.status !== 200) {
  console.log('\n=== Attempt 2: Minimal create ===');
  const res2 = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: MY_ACCOUNT
    })
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(data2, null, 2));
}

// Check all APIs again
console.log('\n=== All APIs After ===');
const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apis = await apiRes.json();
if (Array.isArray(apis)) {
  for (const api of apis) {
    console.log(`  - ${api.name} | ${api.identifier} | system: ${api.is_system}`);
  }
}

// If My Account API exists now, set up everything
const myApi = Array.isArray(apis) ? apis.find(a => a.identifier === MY_ACCOUNT) : null;
if (myApi) {
  console.log('\nMy Account API exists! Setting up MRRT and client grant...');
  
  // Client grant
  const grantRes = await fetch(`https://${DOMAIN}/api/v2/client-grants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      audience: MY_ACCOUNT,
      scope: [
        'create:me:connected_accounts',
        'read:me:connected_accounts',
        'delete:me:connected_accounts'
      ]
    })
  });
  console.log('Client grant status:', grantRes.status);
  const grantData = await grantRes.json();
  console.log('Client grant:', JSON.stringify(grantData, null, 2));
  
  // MRRT
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
        policies: [{
          audience: MY_ACCOUNT,
          scope: [
            "create:me:connected_accounts",
            "read:me:connected_accounts",
            "delete:me:connected_accounts"
          ]
        }]
      }
    })
  });
  console.log('MRRT status:', mrrtRes.status);
  const mrrtData = await mrrtRes.json();
  console.log('MRRT policies:', JSON.stringify(mrrtData.refresh_token?.policies, null, 2));
}

// Fix Google connection - re-enable for Axon app
console.log('\n=== Fixing Google Connection ===');
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=google-oauth2`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const conns = await connRes.json();
if (Array.isArray(conns) && conns.length > 0) {
  const google = conns[0];
  console.log('Current enabled_clients:', google.enabled_clients);
  
  let clients = google.enabled_clients || [];
  if (!clients.includes(CLIENT_ID)) {
    clients.push(CLIENT_ID);
    
    const fixRes = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled_clients: clients
      })
    });
    console.log('Fix status:', fixRes.status);
    const fixData = await fixRes.json();
    console.log('Now enabled for:', fixData.enabled_clients);
  } else {
    console.log('Already enabled for Axon.');
  }
}

