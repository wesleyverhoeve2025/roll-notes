window.RollNotes = window.RollNotes || {};

window.RollNotes.SearchableDropdown = (function() {
  'use strict';

  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'searchable-dropdown';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'searchable-dropdown-input';
    input.placeholder = config.placeholder || 'Search...';
    input.value = config.value || '';
    input.autocomplete = 'off';

    var dropdown = document.createElement('div');
    dropdown.className = 'searchable-dropdown-list';

    var highlightedIndex = -1;
    var filteredOptions = [];
    var isOpen = false;

    function renderOptions(query) {
      dropdown.innerHTML = '';
      highlightedIndex = -1;
      filteredOptions = [];
      var q = (query || '').toLowerCase();
      var currentGroup = '';

      config.options.forEach(function(opt) {
        if (q && opt.label.toLowerCase().indexOf(q) === -1) return;

        if (opt.group && opt.group !== currentGroup) {
          currentGroup = opt.group;
          var header = document.createElement('div');
          header.className = 'dropdown-group-header';
          header.textContent = currentGroup;
          dropdown.appendChild(header);
        }

        var item = document.createElement('div');
        item.className = 'dropdown-item';

        var text = document.createTextNode(opt.label);
        item.appendChild(text);

        if (opt.meta) {
          var meta = document.createElement('span');
          meta.className = 'dropdown-item-meta';
          meta.textContent = opt.meta;
          item.appendChild(meta);
        }

        item.addEventListener('mousedown', function(e) {
          e.preventDefault();
          selectOption(opt);
        });

        dropdown.appendChild(item);
        filteredOptions.push({ el: item, option: opt });
      });

      // Free text option
      if (config.allowCustom && q) {
        var hasExact = filteredOptions.some(function(f) {
          return f.option.label.toLowerCase() === q;
        });
        if (!hasExact) {
          var custom = document.createElement('div');
          custom.className = 'dropdown-item dropdown-custom';
          custom.textContent = 'Use "' + query + '"';
          custom.addEventListener('mousedown', function(e) {
            e.preventDefault();
            selectOption({ label: query, value: query });
          });
          dropdown.appendChild(custom);
        }
      }
    }

    function selectOption(opt) {
      input.value = opt.label;
      closeDropdown();
      if (config.onChange) config.onChange(opt.value || opt.label);
    }

    function openDropdown() {
      renderOptions(input.value);
      dropdown.classList.add('open');
      isOpen = true;
    }

    function closeDropdown() {
      dropdown.classList.remove('open');
      isOpen = false;
      highlightedIndex = -1;
    }

    function updateHighlight() {
      filteredOptions.forEach(function(f, i) {
        f.el.classList.toggle('highlighted', i === highlightedIndex);
      });
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        filteredOptions[highlightedIndex].el.scrollIntoView({ block: 'nearest' });
      }
    }

    input.addEventListener('focus', openDropdown);

    input.addEventListener('input', function() {
      renderOptions(input.value);
      if (!isOpen) dropdown.classList.add('open');
      isOpen = true;
    });

    input.addEventListener('blur', function() {
      setTimeout(function() {
        closeDropdown();
        if (config.allowCustom && input.value && config.onChange) {
          config.onChange(input.value);
        }
      }, 150);
    });

    input.addEventListener('keydown', function(e) {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
        updateHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        updateHighlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex].option);
        } else if (config.allowCustom && input.value) {
          selectOption({ label: input.value, value: input.value });
        }
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    if (config.container) config.container.appendChild(wrapper);

    return {
      el: wrapper,
      setValue: function(val) { input.value = val || ''; },
      getValue: function() { return input.value; },
      destroy: function() { wrapper.remove(); }
    };
  }

  return { create: create };
})();
