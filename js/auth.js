window.RollNotes = window.RollNotes || {};

window.RollNotes.Auth = (function() {
  'use strict';

  var sb = null;
  var currentUser = null;

  function init() {
    var config = window.ROLLNOTES_CONFIG;
    sb = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }

  function getClient() {
    return sb;
  }

  function getUser() {
    return currentUser;
  }

  async function getSession() {
    var result = await sb.auth.getSession();
    if (result.error || !result.data.session) {
      currentUser = null;
      return null;
    }
    currentUser = result.data.session.user;
    return result.data.session;
  }

  async function signIn(email, password) {
    var result = await sb.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (result.error) throw result.error;
    currentUser = result.data.session.user;
    return result.data;
  }

  async function signOut() {
    var result = await sb.auth.signOut();
    if (result.error) throw result.error;
    currentUser = null;
  }

  function onAuthStateChange(callback) {
    sb.auth.onAuthStateChange(callback);
  }

  return {
    init: init,
    getClient: getClient,
    getUser: getUser,
    getSession: getSession,
    signIn: signIn,
    signOut: signOut,
    onAuthStateChange: onAuthStateChange
  };
})();
