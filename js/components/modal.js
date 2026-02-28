window.RollNotes = window.RollNotes || {};

window.RollNotes.Modal = (function() {
  'use strict';

  var overlay, message, confirmBtn, cancelBtn;
  var onConfirm = null;
  var onCancel = null;

  function init() {
    overlay = document.getElementById('modalOverlay');
    message = document.getElementById('modalMessage');
    confirmBtn = document.getElementById('modalConfirm');
    cancelBtn = document.getElementById('modalCancel');

    confirmBtn.addEventListener('click', function() {
      close();
      if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', function() {
      close();
      if (onCancel) onCancel();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        close();
        if (onCancel) onCancel();
      }
    });
  }

  function confirm(msg, confirmCb, cancelCb, opts) {
    opts = opts || {};
    message.textContent = msg;
    confirmBtn.textContent = opts.confirmText || 'Confirm';
    confirmBtn.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
    onConfirm = confirmCb || null;
    onCancel = cancelCb || null;
    overlay.classList.add('open');
  }

  function close() {
    overlay.classList.remove('open');
    onConfirm = null;
    onCancel = null;
  }

  return { init: init, confirm: confirm, close: close };
})();
