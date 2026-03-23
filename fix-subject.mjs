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
const GRANT_ID = 'cgr_WeR4RIqgacBtzmtm';

// Step 1: Delete existing grant
console.log('=== Deleting existing grant ===');
const delRes = await fetch(`https://${DOMAIN}/api/v2/client-grants/${GRANT_ID}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Delete status:', delRes.status);

// Step 2: Create new grant with subject_type: user
console.log('\n=== Creating new grant with subject_type: user ===');
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
    ],
    subject_type: 'user'
  })
});
const createData = await createRes.json();
console.log('Create status:', createRes.status);
console.log('Response:', JSON.stringify(createData, null, 2));

// Step 3: Verify
console.log('\n=== Verification ===');
const verifyRes = await fetch(`https://${DOMAIN}/api/v2/client-grants?client_id=${CLIENT_ID}&audience=${encodeURIComponent(MY_ACCOUNT)}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const verifyData = await verifyRes.json();
console.log('Grant:', JSON.stringify(verifyData, null, 2));

