/* Secure password generator — The Soft Life System.
   Auto-attaches a "Generate" button to every new-password field
   (signup, reset, claim, change-password) and keeps working across
   SPA hash-route changes via a MutationObserver. */

(function () {
  'use strict';

  const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const LOWER = 'abcdefghijkmnopqrstuvwxyz';
  const DIGITS = '23456789';
  const SYMBOLS = '!@#$%^&*';
  const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

  function rand(n) {
    return Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF * n);
  }

  function generateSecurePassword(len = 16) {
    len = Math.max(8, Math.min(64, len));
    let pw = '';
    pw += UPPER[rand(UPPER.length)];
    pw += LOWER[rand(LOWER.length)];
    pw += DIGITS[rand(DIGITS.length)];
    pw += SYMBOLS[rand(SYMBOLS.length)];
    for (let i = pw.length; i < len; i++) pw += ALL[rand(ALL.length)];
    return pw.split('').sort(() => rand(2) - 0.5).join('');
  }

  function makeToggle(input) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-eye';
    btn.setAttribute('aria-label', 'Show password');
    btn.textContent = '👁';
    btn.style.cssText =
      'margin:0 0 0 8px;padding:7px 12px;font-size:.82rem;font-weight:700;' +
      'border-radius:10px;border:1.5px solid var(--line);background:#fff;color:#2a0f4a;cursor:pointer';
    btn.onclick = function () {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁' : '🙈';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    };
    return btn;
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-gen';
    btn.textContent = 'Generate';
    btn.style.cssText =
      'margin:0 0 0 8px;padding:7px 12px;font-size:.82rem;font-weight:700;' +
      'border-radius:10px;border:1.5px solid var(--line);background:#fff;color:#2a0f4a;cursor:pointer';
    btn.onclick = function () {
      const label = this.closest('label');
      const field = label.querySelector('input[type="password"]');
      if (!field) return;
      const len = Math.max(16, parseInt(field.getAttribute('minlength')) || 8);
      field.value = generateSecurePassword(len);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      const old = this.textContent;
      this.textContent = 'Generated';
      setTimeout(() => { this.textContent = old; }, 1000);
    };
    return btn;
  }

  function wrapField(labelEl) {
    const input = labelEl.querySelector('input[type="password"][autocomplete="new-password"]');
    if (!input || labelEl.classList.contains('pw-gen-label')) return;
    labelEl.classList.add('pw-gen-label');
    labelEl.appendChild(makeToggle(input));
    labelEl.appendChild(makeButton());
  }

  function initPasswordGenerators() {
    document.querySelectorAll('label').forEach(wrapField);
  }

  if (document.getElementById('app')) {
    initPasswordGenerators();
    new MutationObserver(() => initPasswordGenerators()).observe(
      document.getElementById('app'), { childList: true, subtree: true }
    );
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      initPasswordGenerators();
      new MutationObserver(() => initPasswordGenerators()).observe(
        document.getElementById('app'), { childList: true, subtree: true }
      );
    });
  }

  window.generateSecurePassword = generateSecurePassword;
})();
