window.RollNotes = window.RollNotes || {};

window.RollNotes.PDFExport = (function() {
  'use strict';

  function exportRoll(rollId) {
    var roll = RollNotes.Store.getRoll(rollId);
    if (!roll) return;
    var camera = RollNotes.Store.getCamera(roll.cameraId);

    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a5' });

    var pageWidth = doc.internal.pageSize.getWidth();
    var margin = 15;
    var y = 20;

    // Title: Roll ID
    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 26);
    doc.text(roll.rollDisplayId, margin, y);
    y += 10;

    // Camera name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(138, 133, 128);
    doc.text(camera ? camera.name : '', margin, y);
    y += 8;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Build fields
    var condition = '';
    if (roll.freshExpired === 'fresh') {
      condition = 'Fresh';
    } else {
      condition = 'Expired';
      var parts = [];
      if (roll.expiryMonth && roll.expiryMonth !== 'Unknown') parts.push(roll.expiryMonth);
      else if (roll.expiryMonth === 'Unknown') parts.push('??');
      if (roll.expiryYear && roll.expiryYear !== 'Unknown') parts.push(roll.expiryYear);
      else if (roll.expiryYear === 'Unknown') parts.push('????');
      if (parts.length > 0) condition += ' ' + parts.join('/');
    }

    var fields = [
      { label: 'Roll Theme', value: roll.rollTheme },
      { label: 'Film Stock', value: roll.filmStock },
      { label: 'Condition', value: condition },
      { label: 'Shot at ISO', value: roll.shotAtIso },
      { label: 'Date Loaded', value: roll.dateLoaded },
      { label: 'Location', value: roll.location },
      { label: 'Dev/Scan', value: roll.devScan },
      { label: 'Notes', value: roll.notes }
    ];

    doc.setFontSize(9);
    fields.forEach(function(field) {
      if (!field.value) return;

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(138, 133, 128);
      doc.text(field.label.toUpperCase(), margin, y);
      y += 5;

      // Value
      doc.setFont('courier', 'normal');
      doc.setTextColor(26, 26, 26);
      var lines = doc.splitTextToSize(field.value, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;

      // Page break check
      if (y > doc.internal.pageSize.getHeight() - 25) {
        doc.addPage();
        y = 20;
      }
    });

    // Footer
    var footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text('Roll Notes / Process', margin, footerY);
    doc.text(new Date().toISOString().split('T')[0], pageWidth - margin, footerY, { align: 'right' });

    doc.save(roll.rollDisplayId + '.pdf');
    RollNotes.toast('PDF exported');
  }

  return { exportRoll: exportRoll };
})();
