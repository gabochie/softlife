const API = {
  base: '',

  async request(path, opts = {}) {
    const token = opts.admin ? Store.adminToken() : Store.token();
    const res = await fetch('/api' + path, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status);
    return data;
  },

  config() { return this.request('/config'); },
  signup(body) { return this.request('/signup', { method: 'POST', body }); },
  signin(body) { return this.request('/signin', { method: 'POST', body }); },
  signout() { return this.request('/signout', { method: 'POST' }); },
  me() { return this.request('/me'); },
  onboarding() { return this.request('/onboarding'); },
  saveOnboarding(body) { return this.request('/onboarding', { method: 'POST', body }); },
  event(event, meta = {}) { return this.request('/events', { method: 'POST', body: { event, meta, path: location.pathname + location.hash } }); },
  tasks() { return this.request('/tasks'); },
  addTask(body) { return this.request('/tasks', { method: 'POST', body }); },
  toggleTask(id) { return this.request('/tasks/toggle', { method: 'POST', body: { id } }); },
  affiliate() { return this.request('/affiliate'); },
  audioToken() { return this.request('/audio-token', { method: 'POST' }); },

  adminLogin(body) { return this.request('/admin/login', { method: 'POST', body }); },
  adminLogout() { return this.request('/admin/logout', { method: 'POST', admin: true }); },
  adminOverview() { return this.request('/admin/overview', { admin: true }); },
  adminUsers(q = '') { return this.request('/admin/users' + (q ? '?q=' + encodeURIComponent(q) : ''), { admin: true }); },
  adminSetTier(id, tier) { return this.request('/admin/users/' + id + '/tier', { method: 'POST', body: { tier }, admin: true }); },
  adminSetRole(id, role) { return this.request('/admin/users/' + id + '/role', { method: 'POST', body: { role }, admin: true }); },
  adminReferrals() { return this.request('/admin/referrals', { admin: true }); },
  adminPurchases() { return this.request('/admin/purchases', { admin: true }); },
  adminOnboarding() { return this.request('/admin/onboarding', { admin: true }); },
  adminAudio() { return this.request('/admin/audio', { admin: true }); }
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
