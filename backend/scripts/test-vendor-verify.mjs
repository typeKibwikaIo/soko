// End-to-end test: login → upload image → submit vendor verification.
const b = 'http://localhost:4000';

const login = await fetch(`${b}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'awa@test.com', password: 'Str0ng!Pass' }),
}).then((r) => r.json());
const t = login.accessToken;
console.log('login ok, roles:', login.user.roles);

// tiny valid PNG (1x1)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function upload() {
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'id.png');
  const res = await fetch(`${b}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}` },
    body: form,
  });
  const body = await res.json();
  console.log('upload:', res.status, body);
  return body.url;
}

const front = await upload();
const back = await upload();

const res = await fetch(`${b}/api/vendors/verification`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
  body: JSON.stringify({
    idNumber: 'ID-2024-001122',
    dateOfBirth: '1995-04-23',
    idDocumentFrontUrl: front,
    idDocumentBackUrl: back,
  }),
});
const body = await res.json();
console.log('vendor verification:', res.status, body.vendorProfile?.verificationStatus);

// uploaded file should be publicly reachable
const img = await fetch(`${b}${front}`);
console.log('uploaded file served:', img.status, img.headers.get('content-type'));
