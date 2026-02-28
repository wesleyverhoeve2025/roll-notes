window.RollNotes = window.RollNotes || {};

window.RollNotes.CSVImport = (function() {
  'use strict';

  function downloadTemplate() {
    var headers = 'roll_id,camera_prefix,roll_theme,film_stock,fresh_expired,expiry_date,shot_at_iso,date_loaded,location,dev_scan,notes';
    var row1 = 'H500CM_001,H500CM,Amsterdam Walk,Kodak Portra 400,Fresh,,Box Speed,2026-01-15,Amsterdam,Carmencita,Overcast morning light';
    var row2 = 'CG2_012,CG2,Studio Session,Ilford HP5 Plus 400,Expired,07/2005,800,2026-02-01,Berlin,Film Lab Ams,"Multiple exposures, testing new lens"';
    var csv = headers + '\n' + row1 + '\n' + row2;

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'roll-notes-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    RollNotes.toast('Template downloaded');
  }

  function importFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      var rows = parseCSV(text);
      if (rows.length === 0) {
        callback({ imported: 0, skipped: 0, skippedIds: [] });
        return;
      }
      var result = RollNotes.Store.importRolls(rows);
      callback(result);
    };
    reader.readAsText(file);
  }

  function parseCSV(text) {
    var lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse header
    var headerLine = lines[0];
    var headers = parseLine(headerLine);

    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      var values = parseLine(line);
      var row = {};
      headers.forEach(function(h, idx) {
        row[h.trim()] = (values[idx] || '').trim();
      });

      // Skip rows with no roll_id
      if (row.roll_id) {
        rows.push(row);
      }
    }
    return rows;
  }

  function parseLine(line) {
    var fields = [];
    var current = '';
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  }

  return {
    downloadTemplate: downloadTemplate,
    importFile: importFile
  };
})();
