window.RollNotes = window.RollNotes || {};
window.RollNotes.Views = window.RollNotes.Views || {};

window.RollNotes.Views.CameraList = (function() {
  'use strict';

  var container = null;

  function render(el) {
    container = el;
    var cameras = RollNotes.Store.getCameras();

    var html = '<div class="camera-grid">';

    cameras.forEach(function(cam) {
      var count = RollNotes.Store.getRollCount(cam.id);
      html += '<div class="card card-clickable camera-card" data-camera-id="' + cam.id + '">' +
        '<div class="camera-card-info">' +
          '<div class="camera-card-name">' + esc(cam.name) + '</div>' +
          '<div class="camera-card-prefix">' + esc(cam.prefix) + '</div>' +
        '</div>' +
        '<div class="camera-card-count">' + count + ' roll' + (count !== 1 ? 's' : '') + '</div>' +
        '<div class="camera-card-arrow">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4l4 4-4 4"/></svg>' +
        '</div>' +
      '</div>';
    });

    html += '</div>';

    // Add camera button
    html += '<div style="margin-top:20px">' +
      '<button class="btn btn-ghost btn-full" id="addCameraBtn">+ Add Camera</button>' +
    '</div>';

    // Add camera form (hidden)
    html += '<div id="addCameraForm" style="display:none;margin-top:16px" class="card">' +
      '<div class="add-camera-form">' +
        '<div class="form-group">' +
          '<label>Camera Name</label>' +
          '<input type="text" id="newCameraName" placeholder="e.g. Leica M6">' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Prefix</label>' +
            '<input type="text" id="newCameraPrefix" placeholder="e.g. LM6" class="mono" style="text-transform:uppercase">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Starting Roll #</label>' +
            '<input type="number" id="newCameraStart" value="1" min="1" class="mono">' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn btn-primary" id="saveNewCamera">Add Camera</button>' +
          '<button class="btn btn-secondary" id="cancelNewCamera">Cancel</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    container.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    // Camera card clicks
    container.querySelectorAll('.camera-card').forEach(function(card) {
      card.addEventListener('click', function() {
        RollNotes.Router.navigate('/camera/' + card.dataset.cameraId);
      });
    });

    // Add camera toggle
    var addBtn = document.getElementById('addCameraBtn');
    var addForm = document.getElementById('addCameraForm');
    addBtn.addEventListener('click', function() {
      addBtn.style.display = 'none';
      addForm.style.display = 'block';
      document.getElementById('newCameraName').focus();
    });

    document.getElementById('cancelNewCamera').addEventListener('click', function() {
      addForm.style.display = 'none';
      addBtn.style.display = 'block';
      clearForm();
    });

    document.getElementById('saveNewCamera').addEventListener('click', saveNewCamera);
  }

  function saveNewCamera() {
    var name = document.getElementById('newCameraName').value.trim();
    var prefix = document.getElementById('newCameraPrefix').value.trim().toUpperCase();
    var start = parseInt(document.getElementById('newCameraStart').value, 10) || 1;

    if (!name) { RollNotes.toast('Camera name is required'); return; }
    if (!prefix) { RollNotes.toast('Prefix is required'); return; }
    if (RollNotes.Store.prefixExists(prefix)) {
      RollNotes.toast('Prefix "' + prefix + '" is already in use');
      return;
    }

    RollNotes.Store.addCamera(name, prefix, start);
    clearForm();
    render(container);
    RollNotes.toast('Camera added');
  }

  function clearForm() {
    document.getElementById('newCameraName').value = '';
    document.getElementById('newCameraPrefix').value = '';
    document.getElementById('newCameraStart').value = '1';
  }

  function destroy() {
    if (container) container.innerHTML = '';
    container = null;
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return { render: render, destroy: destroy };
})();
