window.RollNotes = window.RollNotes || {};

(function() {
  'use strict';

  var Views = RollNotes.Views;
  var Router = RollNotes.Router;
  var Store = RollNotes.Store;

  var appMain = null;
  var backBtn = null;
  var appTitle = null;
  var headerActions = null;
  var memberBadge = null;
  var toastEl = null;
  var toastTimer = null;

  var currentView = null;

  function init() {
    appMain = document.getElementById('appMain');
    backBtn = document.getElementById('backBtn');
    appTitle = document.getElementById('appTitle');
    headerActions = document.getElementById('headerActions');
    memberBadge = document.getElementById('memberBadge');
    toastEl = document.getElementById('toast');

    Store.init();
    RollNotes.Modal.init();

    updateMemberBadge();

    // Back button
    backBtn.addEventListener('click', function() {
      window.history.back();
    });

    // Routes
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

    Router.start();
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

  // Expose globally
  RollNotes.updateMemberBadge = updateMemberBadge;
  RollNotes.toast = toast;

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
