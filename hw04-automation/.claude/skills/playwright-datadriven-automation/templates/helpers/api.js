const { API_URL, ADMIN, USER } = require('./env');

/** Log in through the API and return { token, user }. */
async function apiLogin(request, creds) {
  const res = await request.post(`${API_URL}/login`, { data: creds });
  if (!res.ok()) throw new Error(`API login failed for ${creds.email}: ${res.status()}`);
  return res.json();
}

const adminToken = async (request) => (await apiLogin(request, ADMIN)).token;
const userLogin = (request) => apiLogin(request, USER);

/** Register a throw-away user (unique email) so per-user coupon limits start clean. */
async function registerFreshUser(request, tag = 'u') {
  const email = `${tag}.${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}@eshop.test`;
  const password = 'Fresh123!a';
  const res = await request.post(`${API_URL}/register`, { data: { name: 'Auto Tester', email, password } });
  if (!res.ok()) throw new Error(`register failed: ${res.status()} ${await res.text()}`);
  const login = await apiLogin(request, { email, password });
  return { email, password, token: login.token, user: login.user };
}

module.exports = { apiLogin, adminToken, userLogin, registerFreshUser };
