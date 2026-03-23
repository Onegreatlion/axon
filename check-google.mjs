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
const token = tokenData.access_token;

// Get Google connection full details
const connRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=google-oauth2&include_totals=false`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const connections = await connRes.json();

if (Array.isArray(connections) && connections.length > 0) {
  const google = connections[0];
  console.log('Name:', google.name);
  console.log('ID:', google.id);
  console.log('Strategy:', google.strategy);
  console.log('Enabled clients:', google.enabled_clients);
  console.log('Connected Accounts:', JSON.stringify(google.connected_accounts));
  console.log('Has client_id in options:', !!google.options?.client_id);
  console.log('Scopes:', google.options?.scope);
  
  // Try to enable for our app
  if (!google.enabled_clients || !google.enabled_clients.includes(CLIENT_ID)) {
    console.log('\nGoogle NOT enabled for Axon. Enabling...');
    let clients = google.enabled_clients || [];
    clients.push(CLIENT_ID);
    
    // Try different approach - only send enabled_clients
    const patchRes = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}/enabled-clients`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled_clients: clients })
    });
    console.log('Patch enabled-clients status:', patchRes.status);
    
    if (patchRes.status !== 200) {
      // Try alternate approach
      const patchRes2 = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: google.options
        })
      });
      
      // Re-read to check
      const checkRes = await fetch(`https://${DOMAIN}/api/v2/connections/${google.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const checkData = await checkRes.json();
      console.log('After update - enabled_clients:', checkData.enabled_clients);
    }
  } else {
    console.log('\nGoogle IS enabled for Axon.');
  }
} else {
  console.log('No Google connection found.');
}

// Also check GitHub
const ghRes = await fetch(`https://${DOMAIN}/api/v2/connections?strategy=github`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const ghConns = await ghRes.json();
if (Array.isArray(ghConns) && ghConns.length > 0) {
  console.log('\nGitHub connection enabled for:', ghConns[0].enabled_clients);
}

