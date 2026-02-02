// js/store.js
const Store = (() => {
  const DB_KEY = "TASK_SYSTEM_DB";
  const SESSION_KEY = "TASK_SESSION";

  function nowISO(){ return new Date().toISOString(); }

  function getDB(){
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setDB(db){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function ensureDB(){
    if (!getDB()){
      setDB({
        users: [],
        tasks: [],
        assignments: [],
        seq: { user: 1, task: 1, assign: 1 },
        createdAt: nowISO()
      });
    }
  }

  function getSession(){
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setSession(sess){
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
  }

  function starsText(n){
    const m = Math.max(0, Math.min(5, Number(n) || 0));
    return "★".repeat(m) + "☆".repeat(5 - m);
  }

  return {
    ensureDB, getDB, setDB,
    getSession, setSession, clearSession,
    nowISO, starsText
  };
})();

Store.ensureDB();
