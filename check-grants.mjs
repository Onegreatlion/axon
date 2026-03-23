import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}='([^']*)'`));
  return match ? match[1] : null;
};

const DOMAIN = getEnv('AUTH0_DOMAIN');
const CLIENT_ID = getEnv('AUTH0_CLIENT_ID');
const CLIENT_SECRET = getEnv('AUTH0_CLIENT_SECRET');

console.log('Domain:', DOMAIN);
console.log('Client ID:', CLIENT_ID);

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
  console.log('Failed to get management token:', tokenData);
  process.exit(1);
}

console.log('Got management token.');

const getRes = await fetch(`https://${DOMAIN}/api/v2/clients/${CLIENT_ID}?fields=grant_types,name`, {
  headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
});

const clientData = await getRes.json();
console.log('App:', clientData.name);
console.log('Grant types:', clientData.grant_types);
console.log('Has token-exchange:', clientData.grant_types?.includes('urn:ietf:params:oauth:grant-type:token-exchange'));

if (!clientData.grant_types?.includes('urn:ietf:params:oauth:grant-type:token-exchange')) {
  console.log('\nAdding token-exchange grant type...');
  
  const newGrants = [...(clientData.grant_types || []), 'urn:ietf:params:oauth:grant-type:token-exchange'];
  
  const updateRes = await fetch(`https://${DOMAIN}/api/v2/clients/${CLIENT_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + tokenData.access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ grant_types: newGrants })
  });
  
  const updateData = await updateRes.json();
  
  if (updateData.grant_types) {
    console.log('Updated grant types:', updateData.grant_types);
  } else {
    console.log('Update failed:', updateData);
  }
} else {
  console.log('\nToken-exchange already enabled.');
}
