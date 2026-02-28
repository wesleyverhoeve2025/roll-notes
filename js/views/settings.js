window.RollNotes = window.RollNotes || {};
window.RollNotes.Views = window.RollNotes.Views || {};

window.RollNotes.Views.Settings = (function() {
  'use strict';

  var container = null;

  function render(el) {
    container = el;
    var settings = RollNotes.Store.getSettings();

    var html = '<div class="settings-section">' +
      '<h2>Membership</h2>' +
      '<div class="setting-row">' +
        '<div>' +
          '<div class="setting-label">Process Photo Club Member</div>' +
          '<div class="setting-description">Enables CSV export of all rolls</div>' +
        '</div>' +
        '<label class="switch">' +
          '<input type="checkbox" id="memberToggle"' + (settings.isMember ? ' checked' : '') + '>' +
          '<span class="switch-slider"></span>' +
        '</label>' +
      '</div>' +
    '</div>';

    html += '<div class="settings-section">' +
      '<h2>Import</h2>' +
      '<div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px">' +
        '<div>' +
          '<div class="setting-label">Import Rolls from CSV</div>' +
          '<div class="setting-description">Upload a CSV file to import roll data</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-secondary" id="downloadTemplateBtn">Download CSV Template</button>' +
          '<button class="btn btn-primary" id="importCsvBtn">Import CSV</button>' +
          '<input type="file" id="csvFileInput" accept=".csv" style="display:none">' +
        '</div>' +
        '<div id="importResult"></div>' +
      '</div>' +
    '</div>';

    html += '<div class="settings-section">' +
      '<h2>Export</h2>' +
      '<div class="setting-row">' +
        '<div>' +
          '<div class="setting-label">Export All Rolls as CSV</div>' +
          '<div class="setting-description">Download all rolls across all cameras</div>' +
        '</div>';

    if (settings.isMember) {
      html += '<button class="btn btn-primary" id="exportCsvBtn">Export CSV</button>';
    } else {
      html += '<div class="lock-tooltip">' +
        '<button class="btn btn-secondary" disabled>' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="6" width="8" height="6" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>' +
          ' Export CSV' +
        '</button>' +
        '<span class="tooltip-text">Process Photo Club members only — join at process.photography</span>' +
      '</div>';
    }

    html += '</div></div>';

    // Account section
    var user = RollNotes.Auth.getUser();
    html += '<div class="settings-section">' +
      '<h2>Account</h2>' +
      '<div class="setting-row">' +
        '<div>' +
          '<div class="setting-label">Signed in as</div>' +
          '<div class="setting-description">' + esc(user ? user.email : '') + '</div>' +
        '</div>' +
        '<button class="btn btn-secondary" id="signOutBtn">Sign Out</button>' +
      '</div>' +
    '</div>';

    container.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    // Member toggle
    document.getElementById('memberToggle').addEventListener('change', function() {
      RollNotes.Store.updateSettings({ isMember: this.checked });
      RollNotes.updateMemberBadge();
      // Re-render to update export button
      render(container);
    });

    // Download template
    document.getElementById('downloadTemplateBtn').addEventListener('click', function() {
      RollNotes.CSVImport.downloadTemplate();
    });

    // Import CSV
    var fileInput = document.getElementById('csvFileInput');
    document.getElementById('importCsvBtn').addEventListener('click', function() {
      fileInput.click();
    });
    fileInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        RollNotes.CSVImport.importFile(this.files[0], function(result) {
          var resultEl = document.getElementById('importResult');
          if (resultEl) {
            var html = '<div class="import-summary">';
            html += '<span class="success">' + result.imported + ' rolls imported</span>';
            if (result.skipped > 0) {
              html += '<br><span class="skipped">' + result.skipped + ' skipped';
              if (result.skippedIds.length > 0) {
                html += ' (' + result.skippedIds.join(', ') + ')';
              }
              html += '</span>';
            }
            html += '</div>';
            resultEl.innerHTML = html;
          }
        });
        fileInput.value = '';
      }
    });

    // Export CSV
    var exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        RollNotes.CSVExport.exportAll();
      });
    }

    // Sign out
    document.getElementById('signOutBtn').addEventListener('click', async function() {
      this.disabled = true;
      this.textContent = 'Signing out\u2026';
      try {
        await RollNotes.Auth.signOut();
        window.location.reload();
      } catch (err) {
        this.disabled = false;
        this.textContent = 'Sign Out';
        RollNotes.toast('Sign out failed');
      }
    });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function destroy() {
    if (container) container.innerHTML = '';
    container = null;
  }

  return { render: render, destroy: destroy };
})();
