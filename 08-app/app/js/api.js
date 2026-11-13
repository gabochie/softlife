const API = {
  base: '',

  async request(path, opts = {}) {
    const token = Store.token();
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

  signup(body) { return this.request('/signup', { method: 'POST', body }); },
  signin(body) { return this.request('/signin', { method: 'POST', body }); },
  signout() { return this.request('/signout', { method: 'POST' }); },
  me() { return this.request('/me'); },
  tasks() { return this.request('/tasks'); },
  addTask(body) { return this.request('/tasks', { method: 'POST', body }); },
  toggleTask(id) { return this.request('/tasks/toggle', { method: 'POST', body: { id } }); },
  affiliate() { return this.request('/affiliate'); }
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
