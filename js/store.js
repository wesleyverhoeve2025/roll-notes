window.RollNotes = window.RollNotes || {};

window.RollNotes.Store = (function() {
  'use strict';

  var STORAGE_KEY = 'rollnotes_data';
  var data = null;

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function init() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { data = JSON.parse(raw); } catch (e) { data = null; }
    }
    if (!data) {
      data = createDefaultData();
      persist();
    }
  }

  function createDefaultData() {
    var cameras = {};
    RollNotes.DEFAULT_CAMERAS.forEach(function(cam) {
      var id = 'cam_' + cam.prefix.toLowerCase();
      cameras[id] = {
        id: id,
        name: cam.name,
        prefix: cam.prefix,
        startingRollNumber: 1,
        currentRollNumber: 0,
        createdAt: new Date().toISOString()
      };
    });
    return {
      version: 1,
      settings: { isMember: false, customFilmStocks: [] },
      cameras: cameras,
      rolls: {}
    };
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Cameras
  function getCameras() {
    var arr = Object.values(data.cameras);
    arr.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return arr;
  }

  function getCamera(cameraId) {
    return data.cameras[cameraId] || null;
  }

  function addCamera(name, prefix, startingRollNumber) {
    var id = 'cam_' + generateId();
    data.cameras[id] = {
      id: id,
      name: name,
      prefix: prefix.toUpperCase(),
      startingRollNumber: startingRollNumber || 1,
      currentRollNumber: (startingRollNumber || 1) - 1,
      createdAt: new Date().toISOString()
    };
    persist();
    return data.cameras[id];
  }

  function updateCamera(cameraId, updates) {
    if (!data.cameras[cameraId]) return null;
    Object.assign(data.cameras[cameraId], updates);
    persist();
    return data.cameras[cameraId];
  }

  function deleteCamera(cameraId) {
    if (!data.cameras[cameraId]) return;
    // Remove all rolls for this camera
    Object.keys(data.rolls).forEach(function(rollId) {
      if (data.rolls[rollId].cameraId === cameraId) {
        delete data.rolls[rollId];
      }
    });
    delete data.cameras[cameraId];
    persist();
  }

  function prefixExists(prefix, excludeCameraId) {
    return Object.values(data.cameras).some(function(cam) {
      return cam.prefix.toUpperCase() === prefix.toUpperCase() && cam.id !== excludeCameraId;
    });
  }

  // Rolls
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
    var id = 'roll_' + generateId();
    data.rolls[id] = {
      id: id,
      cameraId: cameraId,
      rollNumber: rollNumber,
      rollDisplayId: formatRollId(cam.prefix, rollNumber),
      rollTheme: '',
      filmStock: '',
      freshExpired: 'fresh',
      expiryMonth: null,
      expiryYear: null,
      shotAtIso: 'Box Speed',
      dateLoaded: new Date().toISOString().split('T')[0],
      location: '',
      devScan: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    cam.currentRollNumber = rollNumber;
    persist();
    return data.rolls[id];
  }

  function addRollWithNumber(cameraId, rollNumber) {
    var cam = data.cameras[cameraId];
    if (!cam) return null;
    var id = 'roll_' + generateId();
    data.rolls[id] = {
      id: id,
      cameraId: cameraId,
      rollNumber: rollNumber,
      rollDisplayId: formatRollId(cam.prefix, rollNumber),
      rollTheme: '',
      filmStock: '',
      freshExpired: 'fresh',
      expiryMonth: null,
      expiryYear: null,
      shotAtIso: 'Box Speed',
      dateLoaded: new Date().toISOString().split('T')[0],
      location: '',
      devScan: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (rollNumber > cam.currentRollNumber) {
      cam.currentRollNumber = rollNumber;
    }
    persist();
    return data.rolls[id];
  }

  function updateRoll(rollId, updates) {
    if (!data.rolls[rollId]) return null;
    Object.assign(data.rolls[rollId], updates);
    data.rolls[rollId].updatedAt = new Date().toISOString();
    persist();
    return data.rolls[rollId];
  }

  function deleteRoll(rollId) {
    delete data.rolls[rollId];
    persist();
  }

  function getAllRolls() {
    var arr = Object.values(data.rolls);
    arr.sort(function(a, b) {
      if (a.cameraId !== b.cameraId) return a.cameraId.localeCompare(b.cameraId);
      return a.rollNumber - b.rollNumber;
    });
    return arr;
  }

  // Settings
  function getSettings() {
    return data.settings;
  }

  function updateSettings(updates) {
    Object.assign(data.settings, updates);
    persist();
    return data.settings;
  }

  function getCustomFilmStocks() {
    return data.settings.customFilmStocks || [];
  }

  function addCustomFilmStock(name) {
    if (!data.settings.customFilmStocks) data.settings.customFilmStocks = [];
    if (data.settings.customFilmStocks.indexOf(name) === -1) {
      data.settings.customFilmStocks.push(name);
      persist();
    }
  }

  // Import
  function importRolls(rolls) {
    var imported = 0;
    var skipped = 0;
    var skippedIds = [];

    rolls.forEach(function(row) {
      // Find camera by prefix
      var cam = Object.values(data.cameras).find(function(c) {
        return c.prefix.toUpperCase() === (row.camera_prefix || '').toUpperCase();
      });
      if (!cam) {
        skipped++;
        skippedIds.push(row.roll_id || 'unknown');
        return;
      }

      // Parse roll number from roll_id
      var parts = (row.roll_id || '').split('_');
      var rollNumber = parseInt(parts[parts.length - 1], 10);
      if (isNaN(rollNumber)) {
        skipped++;
        skippedIds.push(row.roll_id || 'unknown');
        return;
      }

      // Check duplicate
      if (rollDisplayIdExists(cam.id, rollNumber)) {
        skipped++;
        skippedIds.push(row.roll_id);
        return;
      }

      var id = 'roll_' + generateId();
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

      data.rolls[id] = {
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

      if (rollNumber > cam.currentRollNumber) {
        cam.currentRollNumber = rollNumber;
      }
      imported++;
    });

    persist();
    return { imported: imported, skipped: skipped, skippedIds: skippedIds };
  }

  return {
    init: init,
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
    importRolls: importRolls
  };
})();
