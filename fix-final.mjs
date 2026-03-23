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

// Enable skip consent on My Account API
console.log('=== Updating My Account API ===');
const MY_ACCOUNT = `https://${DOMAIN}/me/`;
const apiRes = await fetch(`https://${DOMAIN}/api/v2/resource-servers`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const apis = await apiRes.json();
const myApi = Array.isArray(apis) ? apis.find(a => a.identifier === MY_ACCOUNT) : null;

if (myApi) {
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
  const patchData = await patchRes.json();
  console.log('Status:', patchRes.status);
  if (patchRes.status === 200) {
    console.log('Skip consent enabled successfully.');
  } else {
    console.log('Response:', JSON.stringify(patchData));
  }
}

// Update the client grant to subject_type: user
console.log('\n=== Updating Client Grant Subject Type ===');
const grantId = 'cgr_WeR4RIqgacBtzmtm';
const grantRes = await fetch(`https://${DOMAIN}/api/v2/client-grants/${grantId}`, {
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
    ],
    subject_type: 'user'
  })
});
const grantData = await grantRes.json();
console.log('Status:', grantRes.status);
console.log('Response:', JSON.stringify(grantData, null, 2));

// Verify everything
console.log('\n=== Verification ===');
const verifyRes = await fetch(`https://${DOMAIN}/api/v2/client-grants?client_id=${CLIENT_ID}&audience=${encodeURIComponent(MY_ACCOUNT)}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const verifyData = await verifyRes.json();
console.log('My Account grants:', JSON.stringify(verifyData, null, 2));

