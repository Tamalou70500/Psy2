/* ═══════════════════════════════════════════════════════════
   auth-firebase.js — Auth Google + Profils + Grades
═══════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDTi50ETxwfp55UN7YN-m0sQ_k26kwpQmY",
  authDomain:        "psy-redm.firebaseapp.com",
  projectId:         "psy-redm",
  storageBucket:     "psy-redm.firebasestorage.app",
  messagingSenderId: "968947741685",
  appId:             "1:968947741685:web:22cc44471187e6024ca6bc"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ─── GRADES ─────────────────────────────────────────────
   stagiaire    → cours niv1, examen niv1
   apprenti     → cours niv1+2, examens niv1+2, dossiers
   medecin      → tout cours, tous examens
   specialiste  → comme médecin + titre spé
   admin        → tout + suppression + gestion rôles
────────────────────────────────────────────────────────── */

/* ─── Connexion Google ───────────────────────────────────── */
async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user   = result.user;
  const profil = await ensureProfile(user);
  return { user, profil };
}

/* ─── Déconnexion ────────────────────────────────────────── */
async function signOutUser() {
  // Vider les scores locaux au logout
  localStorage.removeItem('psy_exam_scores');
  await signOut(auth);
  window.location.href = "login.html";
}

/* ─── Créer profil si inexistant ─────────────────────────── */
async function ensureProfile(user) {
  const ref  = doc(db, "medecins", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data = {
      uid:         user.uid,
      email:       user.email,
      nom:         "",
      prenom:      "",
      photo:       user.photoURL || "",
      age:         "",
      cabinet:     "Sunset",
      grade:       "stagiaire",
      role:        "medecin",
      titreSpec:   "",
      badges:      [],
      examens:     {},
      profilOk:    false,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp()
    };
    await setDoc(ref, data);
    return data;
  }
  return snap.data();
}

/* ─── Récupérer le profil courant ─────────────────────────── */
async function getCurrentProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "medecins", user.uid));
  return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
}

/* ─── Mettre à jour le profil ────────────────────────────── */
async function updateProfile(data) {
  const user = auth.currentUser;
  if (!user) return;
  // setDoc avec merge:true — crée le document s'il n'existe pas
  await setDoc(doc(db, "medecins", user.uid), {
    ...data, updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ─── Calculer le grade selon les examens réussis ───────── */
function calcGrade(examens, titreSpec) {
  const e = examens || {};
  if (e['s1']?.passed || e['s2']?.passed || e['s3']?.passed ||
      e['s4']?.passed || e['s5']?.passed) return 'specialiste';
  if (e['e2']?.passed) return 'medecin';
  if (e['e1']?.passed) return 'apprenti';
  return 'stagiaire';
}

/* ─── Sauvegarder un résultat d'examen + maj grade ──────── */
async function saveExamResult(examId, pct, passed, mention) {
  const user = auth.currentUser;
  if (!user) return;
  const ref  = doc(db, "medecins", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  const examens = { ...data.examens };
  const badges  = [...(data.badges || [])];

  if (!examens[examId] || pct > (examens[examId]?.pct || 0)) {
    examens[examId] = { pct, passed, mention, date: new Date().toISOString() };
  }

  const BADGE_MAP = {
    'e1': { id:'niv1',  label:'Niveau 1 — Fondements',     icon:'🟢' },
    'e2': { id:'niv2',  label:'Niveau 2 — Praticien',      icon:'🟡' },
    'e3': { id:'niv3',  label:'Niveau 3 — Spécialiste',    icon:'🔵' },
    'e4': { id:'niv4',  label:'Niveau Expert — Aliéniste',  icon:'🟣' },
    's1': { id:'chir',  label:'Chirurgien certifié',        icon:'🔪' },
    's2': { id:'alien', label:'Aliéniste certifié',         icon:'🧠' },
    's3': { id:'pharma',label:'Pharmacologue certifié',     icon:'💊' },
    's4': { id:'epid',  label:'Épidémiologiste certifié',   icon:'🦠' },
    's5': { id:'legal', label:'Médecin légiste certifié',   icon:'⚖️' },
  };

  if (passed && BADGE_MAP[examId]) {
    const b = BADGE_MAP[examId];
    if (!badges.find(x => x.id === b.id)) {
      badges.push({ ...b, date: new Date().toISOString() });
    }
  }

  const grade = calcGrade(examens, data.titreSpec);

  await setDoc(ref, { examens, badges, grade, updatedAt: serverTimestamp() }, { merge: true });

  // Mettre à jour localStorage avec les vrais scores Firebase
  localStorage.setItem('psy_exam_scores', JSON.stringify(
    Object.fromEntries(Object.entries(examens).map(([k,v]) => [k, { pct: v.pct, passed: v.passed, date: v.date }]))
  ));
}

/* ─── Vérifier les droits d'accès ────────────────────────── */
const GRADE_LEVEL = { stagiaire:0, apprenti:1, medecin:2, specialiste:3, admin:99 };

function canAccess(profile, feature) {
  const g = GRADE_LEVEL[profile?.grade || profile?.role] ?? 0;
  const isAdmin = profile?.role === 'admin';
  if (isAdmin) return true;
  switch(feature) {
    case 'cours_niv1':   return g >= 0;
    case 'exam_niv1':    return g >= 0;
    case 'cours_niv2':   return g >= 1;
    case 'exam_niv2':    return g >= 1;
    case 'dossiers':     return g >= 1;
    case 'cours_niv3':   return g >= 2;
    case 'cours_niv4':   return g >= 2;
    case 'exam_niv3':    return g >= 2;
    case 'exam_niv4':    return g >= 2;
    case 'spe':          return g >= 2;
    case 'delete':       return isAdmin;
    default: return false;
  }
}

/* ─── Observer l'état de connexion ──────────────────────── */
function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ─── Exposer sur window ────────────────────────────────── */
window._fbSignIn        = signInWithGoogle;
window._fbSignOut       = signOutUser;
window._fbGetProfile    = getCurrentProfile;
window._fbUpdateProfile = updateProfile;
window._fbSaveExam      = saveExamResult;
window._fbCanAccess     = canAccess;
window._fbOnReady       = onAuthReady;
window._fbAuth          = auth;
window._fbDb            = db;
window._fbCalcGrade     = calcGrade;
