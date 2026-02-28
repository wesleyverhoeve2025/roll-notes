window.RollNotes = window.RollNotes || {};
window.RollNotes.Views = window.RollNotes.Views || {};

window.RollNotes.Views.Login = (function() {
  'use strict';

  var container = null;
  var onSuccessCallback = null;

  function render(el, opts) {
    container = el;
    onSuccessCallback = opts.onSuccess;

    var html = '<div class="login-container">' +
      '<div class="login-card">' +
        '<h1 class="login-title">Roll Notes</h1>' +
        '<p class="login-subtitle">Film roll logging for photographers</p>' +
        '<div class="login-form">' +
          '<div class="form-group">' +
            '<label>Email</label>' +
            '<input type="email" id="loginEmail" autocomplete="email">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Password</label>' +
            '<input type="password" id="loginPassword" autocomplete="current-password">' +
          '</div>' +
          '<div class="login-error" id="loginError"></div>' +
          '<button class="btn btn-primary btn-full" id="loginBtn">Sign In</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    container.innerHTML = html;
    bindEvents();
    document.getElementById('loginEmail').focus();
  }

  function bindEvents() {
    document.getElementById('loginBtn').addEventListener('click', doLogin);
    document.getElementById('loginPassword').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('loginEmail').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
  }

  async function doLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errorEl = document.getElementById('loginError');
    var btn = document.getElementById('loginBtn');

    if (!email || !password) {
      showError(errorEl, 'Enter your email and password');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in\u2026';
    errorEl.textContent = '';

    try {
      var data = await RollNotes.Auth.signIn(email, password);
      if (onSuccessCallback) onSuccessCallback(data.session);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      showError(errorEl, 'Invalid email or password');
    }
  }

  function showError(el, msg) {
    el.textContent = msg;
  }

  function destroy() {
    if (container) container.innerHTML = '';
    container = null;
    onSuccessCallback = null;
  }

  return { render: render, destroy: destroy };
})();
