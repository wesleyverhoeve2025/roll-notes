window.RollNotes = window.RollNotes || {};
window.RollNotes.Views = window.RollNotes.Views || {};

window.RollNotes.Views.RollList = (function() {
  'use strict';

  var container = null;
  var cameraId = null;
  var currentFilter = 'all';

  function render(el, params) {
    container = el;
    cameraId = params.id;
    currentFilter = 'all';
    buildView();
  }

  function buildView() {
    var camera = RollNotes.Store.getCamera(cameraId);
    if (!camera) { RollNotes.Router.navigate('/'); return; }

    var allRolls = RollNotes.Store.getRolls(cameraId);
    var rolls = allRolls;
    if (currentFilter === 'fresh') {
      rolls = allRolls.filter(function(r) { return r.freshExpired === 'fresh'; });
    } else if (currentFilter === 'expired') {
      rolls = allRolls.filter(function(r) { return r.freshExpired === 'expired'; });
    }

    var html = '<div class="roll-list-header">' +
      '<div class="filter-group">' +
        filterBtn('All', 'all') +
        filterBtn('Fresh', 'fresh') +
        filterBtn('Expired', 'expired') +
      '</div>' +
      '<button class="btn btn-primary" id="addRollBtn">+ New Roll</button>' +
    '</div>';

    if (rolls.length === 0) {
      if (allRolls.length === 0) {
        html += '<div class="empty-state"><p>No rolls logged yet.</p>' +
          '<button class="btn btn-primary" id="addRollEmpty">Log Your First Roll</button></div>';
      } else {
        html += '<div class="empty-state"><p>No ' + currentFilter + ' rolls.</p></div>';
      }
    } else {
      html += '<div class="roll-list">';
      rolls.forEach(function(roll) {
        html += '<div class="card card-clickable roll-card" data-roll-id="' + roll.id + '">' +
          '<div class="roll-card-id">' + esc(roll.rollDisplayId) + '</div>' +
          '<div class="roll-card-details">' +
            '<div class="roll-card-stock">' + esc(roll.filmStock || 'No film stock') + '</div>' +
            '<div class="roll-card-meta">' +
              (roll.freshExpired === 'expired'
                ? '<span class="badge-expired">Expired</span>'
                : '<span class="badge-fresh">Fresh</span>') +
              (roll.dateLoaded ? '<span>' + esc(roll.dateLoaded) + '</span>' : '') +
              (roll.location ? '<span>' + esc(roll.location) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="camera-card-arrow">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4l4 4-4 4"/></svg>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
    bindEvents();
  }

  function filterBtn(label, value) {
    return '<button class="filter-btn' + (currentFilter === value ? ' active' : '') + '" data-filter="' + value + '">' + label + '</button>';
  }

  function bindEvents() {
    // Filter buttons
    container.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentFilter = btn.dataset.filter;
        buildView();
      });
    });

    // Roll card clicks
    container.querySelectorAll('.roll-card').forEach(function(card) {
      card.addEventListener('click', function() {
        RollNotes.Router.navigate('/roll/' + card.dataset.rollId);
      });
    });

    // Add roll buttons
    var addBtn = document.getElementById('addRollBtn');
    var addEmpty = document.getElementById('addRollEmpty');
    if (addBtn) addBtn.addEventListener('click', createRoll);
    if (addEmpty) addEmpty.addEventListener('click', createRoll);
  }

  function createRoll() {
    var camera = RollNotes.Store.getCamera(cameraId);
    var nextNumber = RollNotes.Store.getNextRollNumber(cameraId);
    var displayId = RollNotes.Store.formatRollId(camera.prefix, nextNumber);

    if (RollNotes.Store.rollDisplayIdExists(cameraId, nextNumber)) {
      RollNotes.Modal.confirm(
        'Roll ' + displayId + ' already exists for this camera. Create anyway?',
        function() { doCreateRoll(); }
      );
    } else {
      doCreateRoll();
    }
  }

  function doCreateRoll() {
    var roll = RollNotes.Store.addRoll(cameraId);
    RollNotes.Router.navigate('/roll/' + roll.id);
  }

  function destroy() {
    if (container) container.innerHTML = '';
    container = null;
    cameraId = null;
    currentFilter = 'all';
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return { render: render, destroy: destroy };
})();
