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

const MY_ACCOUNT = `https://${DOMAIN}/me/`;

// List ALL client grants
console.log('=== All Client Grants ===');
const grantsRes = await fetch(`https://${DOMAIN}/api/v2/client-grants`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const grants = await grantsRes.json();

if (Array.isArray(grants)) {
  for (const g of grants) {
    console.log(`  ID: ${g.id} | Client: ${g.client_id} | Audience: ${g.audience} | Scopes: ${JSON.stringify(g.scope)}`);
  }

  // Find the My Account API grant for our app
  const myGrant = grants.find(g => g.client_id === CLIENT_ID && g.audience === MY_ACCOUNT);
  
  if (myGrant) {
    console.log('\nFound existing My Account grant. ID:', myGrant.id);
    console.log('Current scopes:', myGrant.scope);
    
    // Update it with Connected Accounts scopes
    console.log('Updating scopes...');
    const updateRes = await fetch(`https://${DOMAIN}/api/v2/client-grants/${myGrant.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scope: [
          'create:me:connected_accounts',
          'read:me:connected_accounts',
          'delete:me:connected_accounts'
        ]
      })
    });
    const updateData = await updateRes.json();
    console.log('Update status:', updateRes.status);
    console.log('Updated grant:', JSON.stringify(updateData, null, 2));
  } else {
    console.log('\nNo My Account grant found for Axon. Creating...');
    const createRes = await fetch(`https://${DOMAIN}/api/v2/client-grants`, {
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
    const createData = await createRes.json();
    console.log('Create status:', createRes.status);
    console.log('Response:', JSON.stringify(createData, null, 2));
  }
} else {
  console.log('Grants response:', JSON.stringify(grants));
}

// Also update the My Account API to allow skipping consent
console.log('\n=== Update My Account API Settings ===');
const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apis = await apiRes.json();
const myApi = Array.isArray(apis) ? apis.find(a => a.identifier === MY_ACCOUNT) : null;

if (myApi) {
  console.log('My Account API ID:', myApi.id);
  const patchRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers/${encodeURIComponent(myApi.id)}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      skip_consent_for_verifiable_first_party_clients: true
    })
  });
  console.log('Skip consent update status:', patchRes.status);
  const patchData = await patchRes.json();
  if (patchRes.status === 200) {
    console.log('Skip consent enabled.');
  } else {
    console.log('Response:', JSON.stringify(patchData));
  }
}

