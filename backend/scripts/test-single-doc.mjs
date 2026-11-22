const b = 'http://localhost:4000';

// register a BUYER (not vendor) to prove any user can verify
const reg = await fetch(`${b}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Buyer', lastName: 'Test', email: `buyer${Date.now()}@test.com`,
    password: 'Str0ng!Pass', role: 'BUYER',
  }),
}).then((r) => r.json());
const t = reg.accessToken;
console.log('registered buyer, roles:', reg.user.roles);

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const form = new FormData();
form.append('file', new Blob([png], { type: 'image/png' }), 'id.png');
const up = await fetch(`${b}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form }).then((r) => r.json());
console.log('upload:', up);

const res = await fetch(`${b}/api/vendors/verification`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
  body: JSON.stringify({ idNumber: 'ID-998877', dateOfBirth: '1990-01-15', idDocumentUrl: up.url }),
});
const body = await res.json();
console.log('verify submit:', res.status, body.vendorProfile?.verificationStatus ?? body);
