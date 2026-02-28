window.RollNotes = window.RollNotes || {};
window.RollNotes.Views = window.RollNotes.Views || {};

window.RollNotes.Views.CameraSettings = (function() {
  'use strict';

  var container = null;
  var cameraId = null;

  function render(el, params) {
    container = el;
    cameraId = params.id;
    var camera = RollNotes.Store.getCamera(cameraId);
    if (!camera) { RollNotes.Router.navigate('/'); return; }

    var rollCount = RollNotes.Store.getRollCount(cameraId);

    var html = '<div class="camera-form">' +
      '<div class="form-group">' +
        '<label>Camera Name</label>' +
        '<input type="text" id="camName" value="' + attr(camera.name) + '">' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label>Prefix</label>' +
          '<input type="text" id="camPrefix" value="' + attr(camera.prefix) + '" class="mono" style="text-transform:uppercase">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Starting Roll #</label>' +
          '<input type="number" id="camStart" value="' + camera.startingRollNumber + '" min="1" class="mono">' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-primary" id="saveCamBtn">Save Changes</button>' +
    '</div>';

    // Danger zone
    html += '<div class="danger-zone">' +
      '<h3>Danger Zone</h3>' +
      '<p>Deleting this camera will also delete all ' + rollCount + ' roll' + (rollCount !== 1 ? 's' : '') + ' logged to it. This cannot be undone.</p>' +
      '<button class="btn btn-danger" id="deleteCamBtn">Delete Camera</button>' +
    '</div>';

    container.innerHTML = html;
    bindEvents(camera);
  }

  function bindEvents(camera) {
    document.getElementById('saveCamBtn').addEventListener('click', function() {
      var name = document.getElementById('camName').value.trim();
      var prefix = document.getElementById('camPrefix').value.trim().toUpperCase();
      var start = parseInt(document.getElementById('camStart').value, 10) || 1;

      if (!name) { RollNotes.toast('Camera name is required'); return; }
      if (!prefix) { RollNotes.toast('Prefix is required'); return; }
      if (RollNotes.Store.prefixExists(prefix, cameraId)) {
        RollNotes.toast('Prefix "' + prefix + '" is already in use');
        return;
      }

      RollNotes.Store.updateCamera(cameraId, {
        name: name,
        prefix: prefix,
        startingRollNumber: start
      });

      RollNotes.toast('Camera updated');
      RollNotes.Router.navigate('/camera/' + cameraId);
    });

    document.getElementById('deleteCamBtn').addEventListener('click', function() {
      RollNotes.Modal.confirm(
        'Delete ' + camera.name + ' and all its rolls? This cannot be undone.',
        function() {
          RollNotes.Store.deleteCamera(cameraId);
          RollNotes.toast('Camera deleted');
          RollNotes.Router.navigate('/');
        },
        null,
        { danger: true, confirmText: 'Delete' }
      );
    });
  }

  function destroy() {
    if (container) container.innerHTML = '';
    container = null;
    cameraId = null;
  }

  function attr(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  return { render: render, destroy: destroy };
})();
