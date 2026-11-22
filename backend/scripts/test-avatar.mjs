const b = 'http://localhost:4000';
const login = await fetch(`${b}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'awa@test.com', password: 'Str0ng!Pass' }),
}).then((r) => r.json());
const t = login.accessToken;

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const form = new FormData();
form.append('file', new Blob([png], { type: 'image/png' }), 'avatar.png');
const up = await fetch(`${b}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form }).then((r) => r.json());
console.log('upload:', up);

const put = await fetch(`${b}/api/users/profile`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
  body: JSON.stringify({ avatarUrl: up.url }),
});
const body = await put.json();
console.log('profile update:', put.status, 'avatarUrl =', body.user?.avatarUrl ?? body);
