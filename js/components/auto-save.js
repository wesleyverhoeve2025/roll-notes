window.RollNotes = window.RollNotes || {};

window.RollNotes.AutoSave = (function() {
  'use strict';

  var timer = null;
  var statusEl = null;
  var DELAY = 500;

  function save(rollId, fieldName, value) {
    var updates = {};
    updates[fieldName] = value;
    RollNotes.Store.updateRoll(rollId, updates);

    if (timer) clearTimeout(timer);
    showStatus('Saving...');
    timer = setTimeout(function() {
      showStatus('Saved');
      timer = null;
    }, DELAY);
  }

  function showStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function setStatusElement(el) {
    statusEl = el;
  }

  return {
    save: save,
    setStatusElement: setStatusElement
  };
})();
