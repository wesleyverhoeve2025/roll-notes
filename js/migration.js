window.RollNotes = window.RollNotes || {};

window.RollNotes.Migration = (function() {
  'use strict';

  function run(container, userId) {
    return new Promise(function(resolve) {
      var html = '<div class="migration-container">' +
        '<div class="card" style="max-width:480px;width:100%">' +
          '<h2 style="margin-bottom:8px">Welcome to Roll Notes</h2>' +
          '<p style="color:var(--muted);margin-bottom:20px">' +
            'We found roll data saved locally on this device. Would you like to import it into your account?' +
          '</p>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-primary" id="migrateImport">Import My Data</button>' +
            '<button class="btn btn-secondary" id="migrateSkip">Start Fresh</button>' +
          '</div>' +
          '<div id="migrateStatus"></div>' +
        '</div>' +
      '</div>';

      container.innerHTML = html;

      document.getElementById('migrateSkip').addEventListener('click', function() {
        RollNotes.Store.clearLocalData();
        resolve();
      });

      document.getElementById('migrateImport').addEventListener('click', async function() {
        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Importing\u2026';
        document.getElementById('migrateSkip').disabled = true;

        try {
          var result = await doMigration(userId);
          var statusEl = document.getElementById('migrateStatus');
          statusEl.innerHTML = '<div class="import-summary" style="margin-top:16px">' +
            '<span class="success">' + result.cameras + ' cameras and ' + result.rolls + ' rolls imported</span>' +
          '</div>';
          RollNotes.Store.clearLocalData();
          setTimeout(resolve, 1500);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Import My Data';
          document.getElementById('migrateSkip').disabled = false;
          document.getElementById('migrateStatus').innerHTML =
            '<p style="color:var(--danger);margin-top:12px">Import failed: ' + (err.message || 'Unknown error') + '</p>';
        }
      });
    });
  }

  async function doMigration(userId) {
    var localData = RollNotes.Store.getLocalData();
    if (!localData) throw new Error('No local data found');

    var sb = RollNotes.Auth.getClient();
    var cameraIdMap = {};
    var cameraInserts = [];

    Object.values(localData.cameras || {}).forEach(function(cam) {
      var newId = crypto.randomUUID();
      cameraIdMap[cam.id] = newId;
      cameraInserts.push({
        id: newId,
        user_id: userId,
        name: cam.name,
        prefix: cam.prefix,
        starting_number: cam.startingRollNumber || 1,
        current_counter: cam.currentRollNumber || 0
      });
    });

    if (cameraInserts.length > 0) {
      var camRes = await sb.from('cameras').insert(cameraInserts);
      if (camRes.error) throw camRes.error;
    }

    var rollInserts = [];
    Object.values(localData.rolls || {}).forEach(function(roll) {
      var newCameraId = cameraIdMap[roll.cameraId];
      if (!newCameraId) return;

      rollInserts.push({
        id: crypto.randomUUID(),
        user_id: userId,
        camera_id: newCameraId,
        roll_id: roll.rollDisplayId,
        roll_theme: roll.rollTheme || null,
        film_stock: roll.filmStock || null,
        fresh_expired: roll.freshExpired === 'expired' ? 'Expired' : 'Fresh',
        expiry_month: roll.expiryMonth || null,
        expiry_year: roll.expiryYear || null,
        shot_at_iso: roll.shotAtIso || 'Box Speed',
        date_loaded: roll.dateLoaded || null,
        location: roll.location || null,
        dev_scan: roll.devScan || null,
        notes: roll.notes || null
      });
    });

    if (rollInserts.length > 0) {
      var rollRes = await sb.from('rolls').insert(rollInserts);
      if (rollRes.error) throw rollRes.error;
    }

    // Migrate settings
    if (localData.settings) {
      await sb.from('user_settings').upsert({
        user_id: userId,
        is_photo_club_member: localData.settings.isMember || false
      });

      var stockInserts = (localData.settings.customFilmStocks || []).map(function(name) {
        return { user_id: userId, name: name };
      });
      if (stockInserts.length > 0) {
        await sb.from('custom_film_stocks').insert(stockInserts);
      }
    }

    return { cameras: cameraInserts.length, rolls: rollInserts.length };
  }

  return { run: run };
})();
