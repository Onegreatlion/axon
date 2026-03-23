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

// Find Google connection
console.log('=== Finding Google Connection ===');
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=google-oauth2&include_totals=false`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const connText = await connRes.text();
console.log('Connections response status:', connRes.status);

let connections;
try {
  connections = JSON.parse(connText);
} catch (e) {
  console.log('Raw response:', connText);
  process.exit(1);
}

if (!Array.isArray(connections) || connections.length === 0) {
  console.log('No Google connection found. Response:', connections);
  process.exit(1);
}

const google = connections[0];
console.log('Found:', google.name);
console.log('ID:', google.id);
console.log('Connected Accounts:', JSON.stringify(google.connected_accounts));

// Enable Connected Accounts
console.log('\n=== Enabling Connected Accounts ===');
const enableRes = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    connected_accounts: { active: true }
  })
});
const enableData = await enableRes.json();
console.log('Status:', enableRes.status);
if (enableData.connected_accounts) {
  console.log('Connected Accounts enabled:', JSON.stringify(enableData.connected_accounts));
} else if (enableData.message) {
  console.log('Error:', enableData.message);
} else {
  console.log('Response:', JSON.stringify(enableData, null, 2));
}

// List APIs
console.log('\n=== APIs ===');
const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apiText = await apiRes.text();
try {
  const apis = JSON.parse(apiText);
  if (Array.isArray(apis)) {
    for (const api of apis) {
      console.log(`- ${api.name} (${api.identifier})`);
    }
  } else {
    console.log('APIs response:', apis);
  }
} catch (e) {
  console.log('APIs raw:', apiText);
}

// Try the correct token exchange
console.log('\n=== Testing Token Exchange ===');
const session = await fetch(`https://${DOMAIN}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    subject_token: 'test-token',
    subject_token_type: 'urn:ietf:params:oauth:token-type:refresh_token',
    connection: 'google-oauth2'
  })
});
const sessionData = await session.json();
console.log('Token exchange test status:', session.status);
console.log('Response:', JSON.stringify(sessionData));

