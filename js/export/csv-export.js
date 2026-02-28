window.RollNotes = window.RollNotes || {};

window.RollNotes.CSVExport = (function() {
  'use strict';

  function exportAll() {
    var settings = RollNotes.Store.getSettings();
    if (!settings.isMember) {
      RollNotes.toast('CSV export is for Process Photo Club members only');
      return;
    }

    var rolls = RollNotes.Store.getAllRolls();
    if (rolls.length === 0) {
      RollNotes.toast('No rolls to export');
      return;
    }

    var headers = 'roll_id,camera_prefix,roll_theme,film_stock,fresh_expired,expiry_date,shot_at_iso,date_loaded,location,dev_scan,notes';
    var rows = [headers];

    rolls.forEach(function(roll) {
      var camera = RollNotes.Store.getCamera(roll.cameraId);
      var prefix = camera ? camera.prefix : '';

      var expiryDate = '';
      if (roll.freshExpired === 'expired') {
        var month = roll.expiryMonth || 'Unknown';
        var year = roll.expiryYear || 'Unknown';
        expiryDate = month + '/' + year;
      }

      rows.push([
        csvField(roll.rollDisplayId),
        csvField(prefix),
        csvField(roll.rollTheme),
        csvField(roll.filmStock),
        csvField(roll.freshExpired === 'expired' ? 'Expired' : 'Fresh'),
        csvField(expiryDate),
        csvField(roll.shotAtIso),
        csvField(roll.dateLoaded),
        csvField(roll.location),
        csvField(roll.devScan),
        csvField(roll.notes)
      ].join(','));
    });

    var csv = rows.join('\n');
    download(csv, 'roll-notes-export.csv');
    RollNotes.toast(rolls.length + ' rolls exported');
  }

  function csvField(val) {
    val = val || '';
    if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
      return '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }

  function download(content, filename) {
    var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { exportAll: exportAll };
})();
