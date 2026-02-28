window.RollNotes = window.RollNotes || {};

window.RollNotes.Store = (function() {
  'use strict';

  var LOCAL_KEY = 'rollnotes_data';
  var data = null;
  var sb = null;
  var currentUserId = null;
  var updateTimers = {};

  function generateId() {
    return crypto.randomUUID();
  }

  // ── DB ↔ JS mapping ──

  function mapCameraFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      startingRollNumber: row.starting_number,
      currentRollNumber: row.current_counter,
      createdAt: row.created_at
    };
  }

  function mapRollFromDb(row) {
    var parts = (row.roll_id || '').split('_');
    var rollNumber = parseInt(parts[parts.length - 1], 10) || 0;
    return {
      id: row.id,
      cameraId: row.camera_id,
      rollNumber: rollNumber,
      rollDisplayId: row.roll_id,
      rollTheme: row.roll_theme || '',
      filmStock: row.film_stock || '',
      freshExpired: (row.fresh_expired || 'Fresh').toLowerCase(),
      expiryMonth: row.expiry_month || null,
      expiryYear: row.expiry_year || null,
      shotAtIso: row.shot_at_iso || 'Box Speed',
      dateLoaded: row.date_loaded || '',
      location: row.location || '',
      devScan: row.dev_scan || '',
      notes: row.notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ── Init ──

  async function init(userId) {
    currentUserId = userId;
    sb = RollNotes.Auth.getClient();

    var results = await Promise.all([
      sb.from('cameras').select('*'),
      sb.from('rolls').select('*'),
      sb.from('user_settings').select('*').maybeSingle(),
      sb.from('custom_film_stocks').select('*')
    ]);

    var camerasRes = results[0];
    var rollsRes = results[1];
    var settingsRes = results[2];
    var stocksRes = results[3];

    if (camerasRes.error) throw camerasRes.error;
    if (rollsRes.error) throw rollsRes.error;
    if (stocksRes.error) throw stocksRes.error;

    data = {
      cameras: {},
      rolls: {},
      settings: {
        isMember: false,
        settingsId: null,
        customFilmStocks: []
      }
    };

    camerasRes.data.forEach(function(cam) {
      data.cameras[cam.id] = mapCameraFromDb(cam);
    });

    rollsRes.data.forEach(function(roll) {
      data.rolls[roll.id] = mapRollFromDb(roll);
    });

    if (settingsRes.data) {
      data.settings.isMember = settingsRes.data.is_photo_club_member || false;
      data.settings.settingsId = settingsRes.data.id;
    }

    data.settings.customFilmStocks = (stocksRes.data || []).map(function(s) {
      return s.name;
    });

    // If user has zero cameras, seed with defaults
    if (Object.keys(data.cameras).length === 0) {
      await seedDefaultCameras();
    }
  }

  async function seedDefaultCameras() {
    var inserts = RollNotes.DEFAULT_CAMERAS.map(function(cam) {
      return {
        id: generateId(),
        user_id: currentUserId,
        name: cam.name,
        prefix: cam.prefix,
        starting_number: 1,
        current_counter: 0
      };
    });

    var res = await sb.from('cameras').insert(inserts).select();
    if (res.error) throw res.error;

    res.data.forEach(function(cam) {
      data.cameras[cam.id] = mapCameraFromDb(cam);
    });
  }

  async function refreshCache() {
    if (currentUserId) await init(currentUserId);
  }

  // ── Error handling ──

  function handleWriteError(error) {
    console.error('Supabase write error:', error);
    if (typeof RollNotes.toast === 'function') {
      RollNotes.toast('Save failed \u2014 check your connection');
    }
  }

  // ── Cameras (reads are sync from cache) ──

  function getCameras() {
    var arr = Object.values(data.cameras);
    arr.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return arr;
  }

  function getCamera(cameraId) {
    return data.cameras[cameraId] || null;
  }

  function addCamera(name, prefix, startingRollNumber) {
    var id = generateId();
    var start = startingRollNumber || 1;
    var cam = {
      id: id,
      name: name,
      prefix: prefix.toUpperCase(),
      startingRollNumber: start,
      currentRollNumber: start - 1,
      createdAt: new Date().toISOString()
    };
    data.cameras[id] = cam;

    sb.from('cameras').insert({
      id: id,
      user_id: currentUserId,
      name: name,
      prefix: prefix.toUpperCase(),
      starting_number: start,
      current_counter: start - 1
    }).then(function(res) {
      if (res.error) handleWriteError(res.error);
    });

    return cam;
  }

  function updateCamera(cameraId, updates) {
    if (!data.cameras[cameraId]) return null;
    Object.assign(data.cameras[cameraId], updates);

    var dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.prefix !== undefined) dbUpdates.prefix = updates.prefix;
    if (updates.startingRollNumber !== undefined) dbUpdates.starting_number = updates.startingRollNumber;

    sb.from('cameras').update(dbUpdates).eq('id', cameraId).then(function(res) {
      if (res.error) handleWriteError(res.error);
    });

    return data.cameras[cameraId];
  }

  function deleteCamera(cameraId) {
    if (!data.cameras[cameraId]) return;
    Object.keys(data.rolls).forEach(function(rollId) {
      if (data.rolls[rollId].cameraId === cameraId) {
        delete data.rolls[rollId];
      }
    });
    delete data.cameras[cameraId];

    // Cascade handled by DB FK, just delete camera
    sb.from('cameras').delete().eq('id', cameraId).then(function(res) {
      if (res.error) handleWriteError(res.error);
    });
  }

  function prefixExists(prefix, excludeCameraId) {
    return Object.values(data.cameras).some(function(cam) {
      return cam.prefix.toUpperCase() === prefix.toUpperCase() && cam.id !== excludeCameraId;
    });
  }

  // ── Rolls (reads sync from cache) ──

  function getRolls(cameraId) {
    var arr = Object.values(data.rolls).filter(function(r) {
      return r.cameraId === cameraId;
    });
    arr.sort(function(a, b) { return b.rollNumber - a.rollNumber; });
    return arr;
  }

  function getRoll(rollId) {
    return data.rolls[rollId] || null;
  }

  function getRollCount(cameraId) {
    return Object.values(data.rolls).filter(function(r) {
      return r.cameraId === cameraId;
    }).length;
  }

  function getNextRollNumber(cameraId) {
    var cam = data.cameras[cameraId];
    if (!cam) return 1;
    return cam.currentRollNumber + 1;
  }

  function rollDisplayIdExists(cameraId, rollNumber) {
    return Object.values(data.rolls).some(function(r) {
      return r.cameraId === cameraId && r.rollNumber === rollNumber;
    });
  }

  function formatRollId(prefix, number) {
    return prefix + '_' + String(number).padStart(3, '0');
  }

  function addRoll(cameraId) {
    var cam = data.cameras[cameraId];
    if (!cam) return null;
    var rollNumber = cam.currentRollNumber + 1;
    var id = generateId();
    var displayId = formatRollId(cam.prefix, rollNumber);
    var now = new Date().toISOString();
    var today = now.split('T')[0];

    var roll = {
      id: id,
      cameraId: cameraId,
      rollNumber: rollNumber,
      rollDisplayId: displayId,
      rollTheme: '',
      filmStock: '',
      freshExpired: 'fresh',
      expiryMonth: null,
      expiryYear: null,
      shotAtIso: 'Box Speed',
      dateLoaded: today,
      location: '',
      devScan: '',
      notes: '',
      createdAt: now,
      updatedAt: now
    };
    data.rolls[id] = roll;
    cam.currentRollNumber = rollNumber;

    // Insert roll + update camera counter
    Promise.all([
      sb.from('rolls').insert({
        id: id,
        user_id: currentUserId,
        camera_id: cameraId,
        roll_id: displayId,
        fresh_expired: 'Fresh',
        shot_at_iso: 'Box Speed',
        date_loaded: today
      }),
      sb.from('cameras').update({ current_counter: rollNumber }).eq('id', cameraId)
    ]).then(function(results) {
      results.forEach(function(res) {
        if (res.error) handleWriteError(res.error);
      });
    });

    return roll;
  }

  function addRollWithNumber(cameraId, rollNumber) {
    var cam = data.cameras[cameraId];
    if (!cam) return null;
    var id = generateId();
    var displayId = formatRollId(cam.prefix, rollNumber);
    var now = new Date().toISOString();
    var today = now.split('T')[0];

    var roll = {
      id: id,
      cameraId: cameraId,
      rollNumber: rollNumber,
      rollDisplayId: displayId,
      rollTheme: '',
      filmStock: '',
      freshExpired: 'fresh',
      expiryMonth: null,
      expiryYear: null,
      shotAtIso: 'Box Speed',
      dateLoaded: today,
      location: '',
      devScan: '',
      notes: '',
      createdAt: now,
      updatedAt: now
    };
    data.rolls[id] = roll;
    if (rollNumber > cam.currentRollNumber) {
      cam.currentRollNumber = rollNumber;
    }

    Promise.all([
      sb.from('rolls').insert({
        id: id,
        user_id: currentUserId,
        camera_id: cameraId,
        roll_id: displayId,
        fresh_expired: 'Fresh',
        shot_at_iso: 'Box Speed',
        date_loaded: today
      }),
      sb.from('cameras').update({ current_counter: cam.currentRollNumber }).eq('id', cameraId)
    ]).then(function(results) {
      results.forEach(function(res) {
        if (res.error) handleWriteError(res.error);
      });
    });

    return roll;
  }

  function updateRoll(rollId, updates) {
    if (!data.rolls[rollId]) return null;
    Object.assign(data.rolls[rollId], updates);
    data.rolls[rollId].updatedAt = new Date().toISOString();

    // Debounced Supabase write (800ms, batches rapid keystrokes)
    scheduleRollSync(rollId);

    return data.rolls[rollId];
  }

  function scheduleRollSync(rollId) {
    if (updateTimers[rollId]) clearTimeout(updateTimers[rollId]);
    updateTimers[rollId] = setTimeout(function() {
      var roll = data.rolls[rollId];
      if (!roll) return;
      sb.from('rolls').update({
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
      }).eq('id', rollId).then(function(res) {
        if (res.error) handleWriteError(res.error);
      });
      delete updateTimers[rollId];
    }, 800);
  }

  function deleteRoll(rollId) {
    if (updateTimers[rollId]) {
      clearTimeout(updateTimers[rollId]);
      delete updateTimers[rollId];
    }
    delete data.rolls[rollId];

    sb.from('rolls').delete().eq('id', rollId).then(function(res) {
      if (res.error) handleWriteError(res.error);
    });
  }

  function getAllRolls() {
    var arr = Object.values(data.rolls);
    arr.sort(function(a, b) {
      if (a.cameraId !== b.cameraId) return a.cameraId.localeCompare(b.cameraId);
      return a.rollNumber - b.rollNumber;
    });
    return arr;
  }

  // ── Settings ──

  function getSettings() {
    return data.settings;
  }

  function updateSettings(updates) {
    Object.assign(data.settings, updates);

    var dbUpdates = {};
    if (updates.isMember !== undefined) dbUpdates.is_photo_club_member = updates.isMember;

    if (data.settings.settingsId) {
      sb.from('user_settings').update(dbUpdates).eq('id', data.settings.settingsId).then(function(res) {
        if (res.error) handleWriteError(res.error);
      });
    } else {
      // Create settings row
      var newId = generateId();
      sb.from('user_settings').insert({
        id: newId,
        user_id: currentUserId,
        is_photo_club_member: updates.isMember || false
      }).then(function(res) {
        if (res.error) handleWriteError(res.error);
        else data.settings.settingsId = newId;
      });
    }

    return data.settings;
  }

  function getCustomFilmStocks() {
    return data.settings.customFilmStocks || [];
  }

  function addCustomFilmStock(name) {
    if (!data.settings.customFilmStocks) data.settings.customFilmStocks = [];
    if (data.settings.customFilmStocks.indexOf(name) === -1) {
      data.settings.customFilmStocks.push(name);

      sb.from('custom_film_stocks').insert({
        user_id: currentUserId,
        name: name
      }).then(function(res) {
        if (res.error) handleWriteError(res.error);
      });
    }
  }

  // ── Import (async — inserts to Supabase in batch) ──

  async function importRolls(rows) {
    var imported = 0;
    var skipped = 0;
    var skippedIds = [];
    var rollInserts = [];
    var cameraUpdates = {};

    rows.forEach(function(row) {
      var cam = Object.values(data.cameras).find(function(c) {
        return c.prefix.toUpperCase() === (row.camera_prefix || '').toUpperCase();
      });
      if (!cam) {
        skipped++;
        skippedIds.push(row.roll_id || 'unknown');
        return;
      }

      var parts = (row.roll_id || '').split('_');
      var rollNumber = parseInt(parts[parts.length - 1], 10);
      if (isNaN(rollNumber)) {
        skipped++;
        skippedIds.push(row.roll_id || 'unknown');
        return;
      }

      if (rollDisplayIdExists(cam.id, rollNumber)) {
        skipped++;
        skippedIds.push(row.roll_id);
        return;
      }

      var id = generateId();
      var freshExpired = (row.fresh_expired || '').toLowerCase() === 'expired' ? 'expired' : 'fresh';
      var expiryMonth = null;
      var expiryYear = null;
      if (freshExpired === 'expired' && row.expiry_date) {
        var eParts = row.expiry_date.split('/');
        if (eParts.length === 2) {
          expiryMonth = eParts[0] === 'Unknown' ? 'Unknown' : eParts[0];
          expiryYear = eParts[1] === 'Unknown' ? 'Unknown' : eParts[1];
        }
      }

      var roll = {
        id: id,
        cameraId: cam.id,
        rollNumber: rollNumber,
        rollDisplayId: formatRollId(cam.prefix, rollNumber),
        rollTheme: row.roll_theme || '',
        filmStock: row.film_stock || '',
        freshExpired: freshExpired,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        shotAtIso: row.shot_at_iso || 'Box Speed',
        dateLoaded: row.date_loaded || '',
        location: row.location || '',
        devScan: row.dev_scan || '',
        notes: row.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.rolls[id] = roll;

      rollInserts.push({
        id: id,
        user_id: currentUserId,
        camera_id: cam.id,
        roll_id: roll.rollDisplayId,
        roll_theme: roll.rollTheme || null,
        film_stock: roll.filmStock || null,
        fresh_expired: freshExpired === 'expired' ? 'Expired' : 'Fresh',
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        shot_at_iso: roll.shotAtIso,
        date_loaded: roll.dateLoaded || null,
        location: roll.location || null,
        dev_scan: roll.devScan || null,
        notes: roll.notes || null
      });

      if (rollNumber > cam.currentRollNumber) {
        cam.currentRollNumber = rollNumber;
        cameraUpdates[cam.id] = rollNumber;
      }

      imported++;
    });

    // Batch insert rolls
    if (rollInserts.length > 0) {
      var res = await sb.from('rolls').insert(rollInserts);
      if (res.error) {
        handleWriteError(res.error);
        throw res.error;
      }
    }

    // Update camera counters
    var counterPromises = Object.keys(cameraUpdates).map(function(camId) {
      return sb.from('cameras').update({ current_counter: cameraUpdates[camId] }).eq('id', camId);
    });
    if (counterPromises.length > 0) {
      var results = await Promise.all(counterPromises);
      results.forEach(function(res) {
        if (res.error) handleWriteError(res.error);
      });
    }

    return { imported: imported, skipped: skipped, skippedIds: skippedIds };
  }

  // ── localStorage helpers (for migration check) ──

  function hasLocalData() {
    return !!localStorage.getItem(LOCAL_KEY);
  }

  function getLocalData() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); }
    catch (e) { return null; }
  }

  function clearLocalData() {
    localStorage.removeItem(LOCAL_KEY);
  }

  return {
    init: init,
    refreshCache: refreshCache,
    getCameras: getCameras,
    getCamera: getCamera,
    addCamera: addCamera,
    updateCamera: updateCamera,
    deleteCamera: deleteCamera,
    prefixExists: prefixExists,
    getRolls: getRolls,
    getRoll: getRoll,
    getRollCount: getRollCount,
    getNextRollNumber: getNextRollNumber,
    rollDisplayIdExists: rollDisplayIdExists,
    formatRollId: formatRollId,
    addRoll: addRoll,
    addRollWithNumber: addRollWithNumber,
    updateRoll: updateRoll,
    deleteRoll: deleteRoll,
    getAllRolls: getAllRolls,
    getSettings: getSettings,
    updateSettings: updateSettings,
    getCustomFilmStocks: getCustomFilmStocks,
    addCustomFilmStock: addCustomFilmStock,
    importRolls: importRolls,
    hasLocalData: hasLocalData,
    getLocalData: getLocalData,
    clearLocalData: clearLocalData
  };
})();
