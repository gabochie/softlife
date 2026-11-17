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
  forgotPassword(body) { return this.request('/forgot-password', { method: 'POST', body }); },
  resetPassword(body) { return this.request('/reset-password', { method: 'POST', body }); },
  changePassword(body) { return this.request('/change-password', { method: 'POST', body }); },
  signout() { return this.request('/signout', { method: 'POST' }); },
  me() { return this.request('/me'); },
  onboarding() { return this.request('/onboarding'); },
  saveOnboarding(body) { return this.request('/onboarding', { method: 'POST', body }); },
  event(event, meta = {}) { return this.request('/events', { method: 'POST', body: { event, meta, path: location.pathname + location.hash } }); },
  track(body) { return this.request('/track', { method: 'POST', body }); },
  refVisit(ref) { return fetch('/api/ref-visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref }) }).catch(() => {}); },
  claimPreview(body) { return this.request('/claim/preview', { method: 'POST', body }); },
  claimComplete(body) { return this.request('/claim/complete', { method: 'POST', body }); },
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
  adminAudio() { return this.request('/admin/audio', { admin: true }); },

  analyticsOverview() { return this.request('/admin/analytics/overview', { admin: true }); },
  analyticsAudio() { return this.request('/admin/analytics/audio', { admin: true }); },
  analyticsTasks() { return this.request('/admin/analytics/tasks', { admin: true }); },
  analyticsOnboarding() { return this.request('/admin/analytics/onboarding', { admin: true }); },
  analyticsEngagement() { return this.request('/admin/analytics/engagement', { admin: true }); },
  analyticsContent() { return this.request('/admin/analytics/content', { admin: true }); },

  securityOverview() { return this.request('/admin/security', { admin: true }); },

  crmProfile(id) { return this.request('/admin/crm?user_id=' + encodeURIComponent(id), { admin: true }); },
  crmSetStage(id, stage) { return this.request('/admin/crm/stage', { method: 'POST', body: { user_id: id, stage }, admin: true }); },
  crmAddNote(id, note) { return this.request('/admin/crm/notes', { method: 'POST', body: { user_id: id, note }, admin: true }); },

  staffLogin(body) { return this.request('/staff/login', { method: 'POST', body }); },
  teamList() { return this.request('/admin/team', { admin: true }); },
  teamAdd(body) { return this.request('/admin/team', { method: 'POST', body, admin: true }); },
  teamSetActive(id, active) { return this.request('/admin/team/' + id + '/active', { method: 'POST', body: { active }, admin: true }); },
  teamSetRole(id, role) { return this.request('/admin/team/' + id + '/role', { method: 'POST', body: { role }, admin: true }); },

  webhookLog() { return this.request('/admin/webhooks', { admin: true }); },
  webhookReplay(id) { return this.request('/admin/webhooks/replay', { method: 'POST', body: { id }, admin: true }); },
  adminClaims() { return this.request('/admin/claims', { admin: true }); },
  adminEmail() { return this.request('/admin/email', { admin: true }); },
  adminSendCampaign(body) { return this.request('/admin/email/campaigns', { method: 'POST', body, admin: true }); },
  adminRunSequences() { return this.request('/admin/email/sequences', { method: 'POST', admin: true }); }
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
