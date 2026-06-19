/* ═══════════════════════════════════════════
   patients.js — Gestion des patients
   Stockage : Firebase Firestore (cloud sync)
═══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore, collection, doc,
  addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDTi50ETxwfp55UN7YN-m0sQ_k26kwpQmY",
  authDomain:        "psy-redm.firebaseapp.com",
  projectId:         "psy-redm",
  storageBucket:     "psy-redm.firebasestorage.app",
  messagingSenderId: "968947741685",
  appId:             "1:968947741685:web:22cc44471187e6024ca6bc"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COL = "patients";

/* ─── Créer un patient ───────────────────── */
async function patientsCreate(data) {
  const ref = await addDoc(collection(db, COL), {
    nom:        data.nom        || "",
    prenom:     data.prenom     || "",
    age:        data.age        || "",
    sexe:       data.sexe       || "",
    origine:    data.origine    || "",
    profession: data.profession || "",
    photo:      data.photo      || "",
    statut:     data.statut     || "suivi",
    diagnostic: data.diagnostic || "",
    traitement: data.traitement || "",
    seances:    [],
    createdAt:  serverTimestamp(),
    updatedAt:  serverTimestamp()
  });
  return { id: ref.id, ...data };
}

/* ─── Charger tous les patients ─────────── */
async function patientsLoad() {
  const q    = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ─── Obtenir un patient par ID ──────────── */
async function patientsGetById(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* ─── Mettre à jour un patient ───────────── */
async function patientsUpdate(id, data) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
  return true;
}

/* ─── Supprimer un patient ───────────────── */
async function patientsDelete(id) {
  await deleteDoc(doc(db, COL, id));
}

/* ─── Ajouter une séance ─────────────────── */
async function patientsAddSeance(id, seance) {
  const patient = await patientsGetById(id);
  if (!patient) return false;
  const entry = {
    id:        "S" + Date.now(),
    date:      seance.date   || new Date().toISOString().split("T")[0],
    resume:    seance.resume || "",
    humeur:    seance.humeur || "",
    createdAt: new Date().toISOString()
  };
  const seances = [entry, ...(patient.seances || [])];
  await updateDoc(doc(db, COL, id), { seances, updatedAt: serverTimestamp() });
  return entry;
}

/* ─── Supprimer une séance ───────────────── */
async function patientsDeleteSeance(patientId, seanceId) {
  const patient = await patientsGetById(patientId);
  if (!patient) return;
  const seances = (patient.seances || []).filter(s => s.id !== seanceId);
  await updateDoc(doc(db, COL, patientId), { seances, updatedAt: serverTimestamp() });
}

/* ─── Rechercher des patients ────────────── */
async function patientsSearch(query_str) {
  const all = await patientsLoad();
  const q   = query_str.toLowerCase();
  return all.filter(p =>
    p.nom.toLowerCase().includes(q)        ||
    p.prenom.toLowerCase().includes(q)     ||
    (p.diagnostic || "").toLowerCase().includes(q) ||
    (p.origine    || "").toLowerCase().includes(q)
  );
}

/* ─── Formater la date en français ──────── */
function formatDate(iso) {
  if (!iso) return "—";
  // Firestore Timestamp
  if (iso && iso.toDate) iso = iso.toDate().toISOString();
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export {
  patientsCreate, patientsLoad, patientsGetById,
  patientsUpdate, patientsDelete,
  patientsAddSeance, patientsDeleteSeance,
  patientsSearch, formatDate
};
