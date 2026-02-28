window.RollNotes = window.RollNotes || {};

(function() {
  'use strict';

  var Views = RollNotes.Views;
  var Router = RollNotes.Router;
  var Store = RollNotes.Store;
  var Auth = RollNotes.Auth;

  var appMain = null;
  var appHeader = null;
  var backBtn = null;
  var appTitle = null;
  var headerActions = null;
  var memberBadge = null;
  var toastEl = null;
  var toastTimer = null;
  var currentView = null;
  var routesRegistered = false;

  async function init() {
    appMain = document.getElementById('appMain');
    appHeader = document.getElementById('appHeader');
    backBtn = document.getElementById('backBtn');
    appTitle = document.getElementById('appTitle');
    headerActions = document.getElementById('headerActions');
    memberBadge = document.getElementById('memberBadge');
    toastEl = document.getElementById('toast');

    // Init Supabase client
    Auth.init();

    // Listen for sign-out events
    Auth.onAuthStateChange(function(event) {
      if (event === 'SIGNED_OUT') {
        window.location.reload();
      }
    });

    // Check for existing session
    showLoading(appMain);
    var session = null;
    try {
      session = await Auth.getSession();
    } catch (err) {
      showError(appMain, 'Unable to connect. Please check your internet and try again.');
      return;
    }

    if (!session) {
      showLogin();
    } else {
      await loadApp(session.user);
    }
  }

  function showLogin() {
    appHeader.style.display = 'none';
    Views.Login.render(appMain, {
      onSuccess: async function(session) {
        appHeader.style.display = '';
        await loadApp(session.user);
      }
    });
  }

  async function loadApp(user) {
    showLoading(appMain);

    try {
      // Check for localStorage migration
      if (Store.hasLocalData()) {
        appHeader.style.display = 'none';
        await RollNotes.Migration.run(appMain, user.id);
        appHeader.style.display = '';
      }

      // Load all data from Supabase
      showLoading(appMain);
      await Store.init(user.id);

      RollNotes.Modal.init();
      updateMemberBadge();

      // Back button
      backBtn.addEventListener('click', function() {
        window.history.back();
      });

      // Register routes (only once)
      if (!routesRegistered) {
        registerRoutes();
        routesRegistered = true;
      }

      // Refresh cache when tab becomes visible
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
          Store.refreshCache().catch(function(err) {
            console.error('Cache refresh failed:', err);
          });
        }
      });

      Router.start();
    } catch (err) {
      console.error('Load error:', err);
      showError(appMain, 'Failed to load your data. Please check your internet connection and try again.');
    }
  }

  function registerRoutes() {
    Router.addRoute('/', function() {
      showView(Views.CameraList, {}, 'Roll Notes', false, settingsBtn());
    });

    Router.addRoute('/camera/:id', function(params) {
      var cam = Store.getCamera(params.id);
      var title = cam ? cam.name : 'Camera';
      showView(Views.RollList, params, title, true, cameraSettingsBtn(params.id));
    });

    Router.addRoute('/camera/:id/settings', function(params) {
      var cam = Store.getCamera(params.id);
      var title = cam ? cam.name + ' Settings' : 'Camera Settings';
      showView(Views.CameraSettings, params, title, true, '');
    });

    Router.addRoute('/roll/:id', function(params) {
      var roll = Store.getRoll(params.id);
      var title = roll ? roll.rollDisplayId : 'Roll';
      showView(Views.RollDetail, params, title, true, '');
    });

    Router.addRoute('/settings', function() {
      showView(Views.Settings, {}, 'Settings', true, '');
    });
  }

  function showView(view, params, title, showBack, actionsHtml) {
    if (currentView && currentView.destroy) currentView.destroy();
    currentView = view;

    appTitle.textContent = title;
    backBtn.classList.toggle('visible', showBack);
    headerActions.innerHTML = actionsHtml || '';

    appMain.innerHTML = '';
    window.scrollTo(0, 0);
    view.render(appMain, params);
  }

  function settingsBtn() {
    return '<button class="header-btn" onclick="RollNotes.Router.navigate(\'/settings\')" aria-label="Settings">' +
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="10" cy="10" r="2.5"/>' +
        '<path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4"/>' +
      '</svg>' +
    '</button>';
  }

  function cameraSettingsBtn(cameraId) {
    return '<button class="header-btn" onclick="RollNotes.Router.navigate(\'/camera/' + cameraId + '/settings\')" aria-label="Camera Settings">' +
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="10" cy="10" r="2.5"/>' +
        '<path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4"/>' +
      '</svg>' +
    '</button>';
  }

  function updateMemberBadge() {
    var settings = Store.getSettings();
    memberBadge.classList.toggle('visible', settings.isMember);
  }

  function toast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    toastTimer = setTimeout(function() {
      toastEl.classList.remove('visible');
      toastTimer = null;
    }, 2500);
  }

  function showLoading(el) {
    el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  }

  function showError(el, message) {
    el.innerHTML = '<div class="error-state"><p>' + message + '</p>' +
      '<button class="btn btn-primary" onclick="location.reload()">Try Again</button></div>';
  }

  // Expose globally
  RollNotes.updateMemberBadge = updateMemberBadge;
  RollNotes.toast = toast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
