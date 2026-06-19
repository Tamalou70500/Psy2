/* auth.js — Gestion connexion · Cabinet Dr. Abernathy Lucius */

const USERS = [
  { login: "docteur",   password: "1899", name: "Dr. Abernathy Lucius", role: "Aliéniste" },
  { login: "personnel", password: "sunset1904", name: "Personnel",        role: "Cabinet" }
];

const SESSION_KEY = "psy_session";

function authLogin(login, password) {
  const user = USERS.find(u => u.login === login && u.password === password);
  if (!user) return false;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    login: user.login, name: user.name, role: user.role, ts: Date.now()
  }));
  return true;
}

function authLogout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

function authGetSession() {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; }
  catch(e) { return null; }
}

function authRequire() {
  const s = authGetSession();
  if (!s) { window.location.href = "login.html"; return null; }
  return s;
}

function authInjectUser() {
  const s = authGetSession();
  if (!s) return;
  const el = document.getElementById("navbar-user");
  if (el) el.textContent = `${s.name} · ${s.role}`;
}
