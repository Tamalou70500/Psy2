/* ═══════════════════════════════════════════
   patients.js — Gestion des patients
   Stockage : localStorage
═══════════════════════════════════════════ */

const PATIENTS_KEY = "psy_patients";

/* ─── Charger tous les patients ─────────── */
function patientsLoad() {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

/* ─── Sauvegarder tous les patients ─────── */
function patientsSave(list) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(list));
}

/* ─── Générer un ID unique ───────────────── */
function patientsGenId() {
  return "P" + Date.now() + Math.floor(Math.random() * 1000);
}

/* ─── Créer un patient ───────────────────── */
function patientsCreate(data) {
  const list = patientsLoad();
  const patient = {
    id:         patientsGenId(),
    nom:        data.nom        || "",
    prenom:     data.prenom     || "",
    age:        data.age        || "",
    sexe:       data.sexe       || "",
    origine:    data.origine    || "",
    profession: data.profession || "",
    photo:      data.photo      || "",   // base64
    statut:     data.statut     || "suivi",
    diagnostic: data.diagnostic || "",
    traitement: data.traitement || "",
    notes:      data.notes      || "",
    seances:    [],
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString()
  };
  list.push(patient);
  patientsSave(list);
  return patient;
}

/* ─── Obtenir un patient par ID ──────────── */
function patientsGetById(id) {
  return patientsLoad().find(p => p.id === id) || null;
}

/* ─── Mettre à jour un patient ───────────── */
function patientsUpdate(id, data) {
  const list = patientsLoad();
  const idx  = list.findIndex(p => p.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
  patientsSave(list);
  return true;
}

/* ─── Supprimer un patient ───────────────── */
function patientsDelete(id) {
  const list = patientsLoad().filter(p => p.id !== id);
  patientsSave(list);
}

/* ─── Ajouter une séance ─────────────────── */
function patientsAddSeance(id, seance) {
  const list    = patientsLoad();
  const idx     = list.findIndex(p => p.id === id);
  if (idx === -1) return false;
  const entry = {
    id:        "S" + Date.now(),
    date:      seance.date  || new Date().toISOString().split("T")[0],
    resume:    seance.resume || "",
    humeur:    seance.humeur || "",
    createdAt: new Date().toISOString()
  };
  list[idx].seances = list[idx].seances || [];
  list[idx].seances.unshift(entry);
  list[idx].updatedAt = new Date().toISOString();
  patientsSave(list);
  return entry;
}

/* ─── Supprimer une séance ───────────────── */
function patientsDeleteSeance(patientId, seanceId) {
  const list = patientsLoad();
  const idx  = list.findIndex(p => p.id === patientId);
  if (idx === -1) return;
  list[idx].seances = (list[idx].seances || []).filter(s => s.id !== seanceId);
  patientsSave(list);
}

/* ─── Rechercher des patients ────────────── */
function patientsSearch(query) {
  const q = query.toLowerCase();
  return patientsLoad().filter(p =>
    p.nom.toLowerCase().includes(q) ||
    p.prenom.toLowerCase().includes(q) ||
    p.diagnostic.toLowerCase().includes(q) ||
    p.origine.toLowerCase().includes(q)
  );
}

/* ─── Formater la date en français ──────── */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
