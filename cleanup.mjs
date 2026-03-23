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

// Delete the old client-type grant
const delRes = await fetch(`https://${DOMAIN}/api/v2/client-grants/cgr_WeR4RIqgacBtzmtm`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Delete old grant status:', delRes.status);

