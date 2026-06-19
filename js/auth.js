/* ═══════════════════════════════════════════
   auth.js — Gestion de la connexion
   Identifiants codés en dur (usage privé)
═══════════════════════════════════════════ */

const USERS = [
  { login: "docteur", password: "1899", name: "Dr. Moreau", role: "Aliéniste" }
  /* Ajoutez d'autres comptes ici si besoin :
  { login: "assistant", password: "redm", name: "Infirmier Dubois", role: "Assistant" }
  */
];

const SESSION_KEY = "psy_session";

/* ─── Connexion ──────────────────────────── */
function authLogin(login, password) {
  const user = USERS.find(u => u.login === login && u.password === password);
  if (!user) return false;
  const session = { login: user.login, name: user.name, role: user.role, ts: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
}

/* ─── Déconnexion ────────────────────────── */
function authLogout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "index.html";
}

/* ─── Récupérer la session ───────────────── */
function authGetSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

/* ─── Vérifier et rediriger si non connecté  */
function authRequire() {
  const session = authGetSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

/* ─── Injecter infos utilisateur dans navbar */
function authInjectUser() {
  const session = authGetSession();
  if (!session) return;
  const el = document.getElementById("navbar-user");
  if (el) el.textContent = `${session.name} · ${session.role}`;
}
