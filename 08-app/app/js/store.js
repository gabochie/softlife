const Store = {
  TOKEN_KEY: 'softlife_token',

  token(value) {
    if (value === undefined) return localStorage.getItem(this.TOKEN_KEY);
    if (value === null) localStorage.removeItem(this.TOKEN_KEY);
    else localStorage.setItem(this.TOKEN_KEY, value);
  },

  user(value) {
    if (value === undefined) {
      try { return JSON.parse(localStorage.getItem('softlife_user')); }
      catch { return null; }
    }
    if (value === null) localStorage.removeItem('softlife_user');
    else localStorage.setItem('softlife_user', JSON.stringify(value));
  },

  session() {
    return { token: this.token(), user: this.user() };
  },

  clear() {
    this.token(null);
    this.user(null);
  }
};
