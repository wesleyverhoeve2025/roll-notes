window.RollNotes = window.RollNotes || {};

window.RollNotes.Router = (function() {
  'use strict';

  var routes = [];

  function addRoute(pattern, handler) {
    var paramNames = [];
    var regexStr = pattern.replace(/:([^/]+)/g, function(_, name) {
      paramNames.push(name);
      return '([^/]+)';
    });
    routes.push({
      regex: new RegExp('^' + regexStr + '$'),
      paramNames: paramNames,
      handler: handler
    });
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function resolve() {
    var hash = (window.location.hash || '#/').slice(1) || '/';
    for (var i = 0; i < routes.length; i++) {
      var match = hash.match(routes[i].regex);
      if (match) {
        var params = {};
        routes[i].paramNames.forEach(function(name, idx) {
          params[name] = decodeURIComponent(match[idx + 1]);
        });
        routes[i].handler(params);
        return;
      }
    }
    navigate('/');
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return {
    addRoute: addRoute,
    navigate: navigate,
    start: start
  };
})();
