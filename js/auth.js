// js/auth.js
const Auth = (() => {

  function login(){
    const login = (document.getElementById("login")?.value || "").trim();
    const pass  = (document.getElementById("password")?.value || "");

    const db = Store.getDB();
    const user = db.users.find(u => u.login === login);

    if (!user || user.pass !== pass){
      alert("Неверный логин или пароль");
      return;
    }

    Store.setSession({
      userId: user.id,
      role: user.role,
      name: user.name,
      login: user.login,
      at: Store.nowISO()
    });

    if (user.role === "admin") location.href = "admin.html";
    else if (user.role === "boss") location.href = "boss.html";
    else location.href = "tasks.html";
  }

  function logout(){
    Store.clearSession();
    location.href = "login.html";
  }

  return { login, logout };
})();
