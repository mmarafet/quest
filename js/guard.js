// js/guard.js
const Guard = (() => {
  function requireRole(roles){
    const sess = Store.getSession();
    if (!sess) { location.href = "login.html"; return; }
    if (!roles.includes(sess.role)) {
      alert("Нет доступа. Ваша роль: " + sess.role);
      location.href = "login.html";
    }
  }
  function meLine(){
    const sess = Store.getSession();
    return sess ? `${sess.name} • ${sess.login} • role: ${sess.role}` : "";
  }
  return { requireRole, meLine };
})();
