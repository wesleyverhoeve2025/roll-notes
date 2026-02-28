window.RollNotes = window.RollNotes || {};
window.RollNotes.Views = window.RollNotes.Views || {};

window.RollNotes.Views.RollDetail = (function() {
  'use strict';

  var container = null;
  var rollId = null;
  var filmStockDropdown = null;
  var locationDropdown = null;

  var ISO_OPTIONS = [
    'Box Speed', '6', '8', '12', '16', '20', '25', '32', '40', '50',
    '64', '80', '100', '125', '160', '200', '250', '320', '400',
    '500', '640', '800', '1200', '1600', '3200', '6400', '12800'
  ];

  function render(el, params) {
    container = el;
    rollId = params.id;
    var roll = RollNotes.Store.getRoll(rollId);
    if (!roll) { RollNotes.Router.navigate('/'); return; }
    var camera = RollNotes.Store.getCamera(roll.cameraId);

    var html = '<div class="roll-detail-header">' +
      '<div class="roll-display-id">' + esc(roll.rollDisplayId) + '</div>' +
      '<div class="save-status" id="saveStatus">Saved</div>' +
    '</div>';

    html += '<div class="roll-form">';

    // Camera (read-only)
    html += formGroup('Camera', '<input type="text" value="' + esc(camera.name) + '" disabled style="opacity:0.6">');

    // Roll Theme
    html += formGroup('Roll Theme',
      '<input type="text" id="fieldTheme" value="' + attr(roll.rollTheme) + '" placeholder="e.g. Amsterdam March 2026">');

    // Film Stock (searchable dropdown container)
    html += formGroup('Film Stock', '<div id="filmStockContainer"></div>');

    // Fresh / Expired
    html += formGroup('Condition', buildConditionField(roll));

    // Row: ISO + Date
    html += '<div class="form-row">' +
      formGroup('Shot at ISO', buildIsoSelect(roll.shotAtIso)) +
      formGroup('Date Loaded', '<input type="date" id="fieldDate" class="mono" value="' + attr(roll.dateLoaded) + '">') +
    '</div>';

    // Location (searchable dropdown container)
    html += formGroup('Location', '<div id="locationContainer"></div>');

    // Dev/Scan
    html += formGroup('Dev / Scan',
      '<input type="text" id="fieldDevScan" value="' + attr(roll.devScan) + '" placeholder="e.g. Carmencita, Film Lab Ams">');

    // Notes
    html += formGroup('Notes',
      '<textarea id="fieldNotes" placeholder="Any notes about this roll...">' + esc(roll.notes) + '</textarea>');

    html += '</div>'; // end roll-form

    // Actions
    html += '<div class="roll-actions">' +
      '<button class="btn btn-ghost" id="exportPdfBtn">' +
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 14h8M8 2v9M5 8l3 3 3-3"/></svg>' +
        ' Export PDF' +
      '</button>' +
      '<button class="btn btn-ghost" id="deleteRollBtn" style="color:var(--danger);margin-left:auto">' +
        'Delete Roll' +
      '</button>' +
    '</div>';

    container.innerHTML = html;

    // Init auto-save status
    RollNotes.AutoSave.setStatusElement(document.getElementById('saveStatus'));

    // Init searchable dropdowns
    initFilmStockDropdown(roll);
    initLocationDropdown(roll);

    bindEvents(roll);
  }

  function buildConditionField(roll) {
    var freshActive = roll.freshExpired === 'fresh' ? ' active' : '';
    var expiredActive = roll.freshExpired === 'expired' ? ' active' : '';
    var visible = roll.freshExpired === 'expired' ? ' visible' : '';

    var html = '<div class="toggle-group">' +
      '<button class="toggle-btn' + freshActive + '" data-value="fresh" id="toggleFresh">Fresh</button>' +
      '<button class="toggle-btn' + expiredActive + '" data-value="expired" id="toggleExpired">Expired</button>' +
    '</div>' +
    '<div class="expiry-details' + visible + '" id="expiryDetails">' +
      '<select id="expiryMonth" class="mono">' + buildMonthOptions(roll.expiryMonth) + '</select>' +
      '<select id="expiryYear" class="mono">' + buildYearOptions(roll.expiryYear) + '</select>' +
    '</div>';
    return html;
  }

  function buildMonthOptions(selected) {
    var opts = '<option value="Unknown">Month</option>';
    for (var m = 1; m <= 12; m++) {
      var val = String(m).padStart(2, '0');
      opts += '<option value="' + val + '"' + (selected === val ? ' selected' : '') + '>' + val + '</option>';
    }
    return opts;
  }

  function buildYearOptions(selected) {
    var opts = '<option value="Unknown">Year</option>';
    var currentYear = new Date().getFullYear();
    for (var y = currentYear; y >= 1950; y--) {
      var val = String(y);
      opts += '<option value="' + val + '"' + (selected === val ? ' selected' : '') + '>' + val + '</option>';
    }
    return opts;
  }

  function buildIsoSelect(selected) {
    var html = '<select id="fieldIso" class="mono">';
    ISO_OPTIONS.forEach(function(iso) {
      html += '<option value="' + iso + '"' + (selected === iso ? ' selected' : '') + '>' + iso + '</option>';
    });
    html += '</select>';
    return html;
  }

  function initFilmStockDropdown(roll) {
    var options = [];
    RollNotes.FILM_STOCKS.forEach(function(group) {
      group.stocks.forEach(function(stock) {
        options.push({
          label: stock,
          value: stock,
          group: group.group,
          meta: group.discontinued ? 'discontinued' : null
        });
      });
    });
    // Add custom stocks
    RollNotes.Store.getCustomFilmStocks().forEach(function(stock) {
      options.unshift({ label: stock, value: stock, group: 'Custom' });
    });

    filmStockDropdown = RollNotes.SearchableDropdown.create({
      container: document.getElementById('filmStockContainer'),
      options: options,
      placeholder: 'Search film stocks...',
      value: roll.filmStock,
      allowCustom: true,
      onChange: function(val) {
        RollNotes.AutoSave.save(rollId, 'filmStock', val);
      }
    });
  }

  function initLocationDropdown(roll) {
    var options = [];
    RollNotes.CITIES.primary.forEach(function(city) {
      options.push({ label: city, value: city, group: 'Frequent' });
    });
    RollNotes.CITIES.secondary.forEach(function(city) {
      options.push({ label: city, value: city, group: 'Other Cities' });
    });

    locationDropdown = RollNotes.SearchableDropdown.create({
      container: document.getElementById('locationContainer'),
      options: options,
      placeholder: 'Search cities or type custom...',
      value: roll.location,
      allowCustom: true,
      onChange: function(val) {
        RollNotes.AutoSave.save(rollId, 'location', val);
      }
    });
  }

  function bindEvents(roll) {
    // Theme
    document.getElementById('fieldTheme').addEventListener('input', function() {
      RollNotes.AutoSave.save(rollId, 'rollTheme', this.value);
    });

    // Fresh/Expired toggle
    document.getElementById('toggleFresh').addEventListener('click', function() {
      setCondition('fresh');
    });
    document.getElementById('toggleExpired').addEventListener('click', function() {
      setCondition('expired');
    });

    // Expiry month/year
    document.getElementById('expiryMonth').addEventListener('change', function() {
      RollNotes.AutoSave.save(rollId, 'expiryMonth', this.value);
    });
    document.getElementById('expiryYear').addEventListener('change', function() {
      RollNotes.AutoSave.save(rollId, 'expiryYear', this.value);
    });

    // ISO
    document.getElementById('fieldIso').addEventListener('change', function() {
      RollNotes.AutoSave.save(rollId, 'shotAtIso', this.value);
    });

    // Date
    document.getElementById('fieldDate').addEventListener('change', function() {
      RollNotes.AutoSave.save(rollId, 'dateLoaded', this.value);
    });

    // Dev/Scan
    document.getElementById('fieldDevScan').addEventListener('input', function() {
      RollNotes.AutoSave.save(rollId, 'devScan', this.value);
    });

    // Notes
    document.getElementById('fieldNotes').addEventListener('input', function() {
      RollNotes.AutoSave.save(rollId, 'notes', this.value);
    });

    // PDF export
    document.getElementById('exportPdfBtn').addEventListener('click', function() {
      if (window.jspdf) {
        RollNotes.PDFExport.exportRoll(rollId);
      } else {
        RollNotes.toast('PDF library still loading, try again in a moment');
      }
    });

    // Delete roll
    document.getElementById('deleteRollBtn').addEventListener('click', function() {
      RollNotes.Modal.confirm(
        'Delete roll ' + roll.rollDisplayId + '? This cannot be undone.',
        function() {
          var camId = roll.cameraId;
          RollNotes.Store.deleteRoll(rollId);
          RollNotes.toast('Roll deleted');
          RollNotes.Router.navigate('/camera/' + camId);
        },
        null,
        { danger: true, confirmText: 'Delete' }
      );
    });
  }

  function setCondition(value) {
    var freshBtn = document.getElementById('toggleFresh');
    var expiredBtn = document.getElementById('toggleExpired');
    var details = document.getElementById('expiryDetails');

    freshBtn.classList.toggle('active', value === 'fresh');
    expiredBtn.classList.toggle('active', value === 'expired');

    if (value === 'expired') {
      details.classList.add('visible');
    } else {
      details.classList.remove('visible');
    }

    RollNotes.AutoSave.save(rollId, 'freshExpired', value);

    if (value === 'fresh') {
      RollNotes.AutoSave.save(rollId, 'expiryMonth', null);
      RollNotes.AutoSave.save(rollId, 'expiryYear', null);
    }
  }

  function destroy() {
    if (filmStockDropdown) { filmStockDropdown.destroy(); filmStockDropdown = null; }
    if (locationDropdown) { locationDropdown.destroy(); locationDropdown = null; }
    if (container) container.innerHTML = '';
    container = null;
    rollId = null;
  }

  function formGroup(label, content) {
    return '<div class="form-group"><label>' + label + '</label>' + content + '</div>';
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function attr(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  return { render: render, destroy: destroy };
})();
