// seed-users.mjs
// Run once after deploy: node seed-users.mjs
// Requires NETLIFY_SITE_ID and NETLIFY_TOKEN env vars, or just use the admin panel

const APPROVED_EMAILS = [
  'cherry@huunuu.com',
  'cherryannewilliams@hotmail.com',
  'steve@huunuu.com',
  'connor@1801.ai',
  'steve.turner@dataintellect.com',
  'pwmcconkey@gmail.com',
  'clare@huunuu.com',
];

const BASE_URL = process.env.SITE_URL || 'https://huunuubfcassessment.netlify.app';
const ADMIN_PASS = 'ADMIN_PASSWORD140890';

for (const email of APPROVED_EMAILS) {
  const res = await fetch(`${BASE_URL}/api/store?action=add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, adminPass: ADMIN_PASS })
  });
  const data = await res.json();
  if (data.ok) console.log('Added:', email);
  else if (data.error === 'Already exists') console.log('Already exists:', email);
  else console.log('Error for', email, data);
}
