/* ═══════════════════════════════════════════════════════════
   auth-firebase.js — Authentification Google + Profils
   Firebase Auth + Firestore
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

// UID admin — seul ce compte peut supprimer
const ADMIN_UIDS = [];  // Sera rempli au premier login admin

/* ─── Connexion Google ───────────────────────────────────── */
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;
    await ensureProfile(user);
    return user;
  } catch(e) {
    console.error("Erreur connexion Google:", e);
    throw e;
  }
}

/* ─── Déconnexion ────────────────────────────────────────── */
async function signOutUser() {
  await signOut(auth);
  window.location.href = "login.html";
}

/* ─── Créer profil si inexistant ─────────────────────────── */
async function ensureProfile(user) {
  const ref  = doc(db, "medecins", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:       user.uid,
      email:     user.email,
      nom:       user.displayName?.split(" ").slice(1).join(" ") || "",
      prenom:    user.displayName?.split(" ")[0] || "",
      photo:     user.photoURL || "",
      age:       "",
      cabinet:   "Sunset",
      role:      "docteur",
      badges:    [],
      examens:   {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  return snap.exists() ? snap.data() : null;
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
  await updateDoc(doc(db, "medecins", user.uid), {
    ...data, updatedAt: serverTimestamp()
  });
}

/* ─── Sauvegarder un résultat d'examen ───────────────────── */
async function saveExamResult(examId, pct, passed, mention) {
  const user = auth.currentUser;
  if (!user) return;
  const ref     = doc(db, "medecins", user.uid);
  const snap    = await getDoc(ref);
  const data    = snap.data() || {};
  const examens = data.examens || {};
  const badges  = data.badges  || [];

  // Garder le meilleur score
  if (!examens[examId] || pct > examens[examId].pct) {
    examens[examId] = {
      pct, passed, mention,
      date: new Date().toISOString()
    };
  }

  // Attribuer les badges
  const BADGE_MAP = {
    'e1': { id: 'niv1', label: 'Niveau 1 — Fondements',    icon: '🟢' },
    'e2': { id: 'niv2', label: 'Niveau 2 — Praticien',     icon: '🟡' },
    'e3': { id: 'niv3', label: 'Niveau 3 — Spécialiste',   icon: '🔵' },
    'e4': { id: 'niv4', label: 'Niveau Expert — Aliéniste', icon: '🟣' },
    's1': { id: 'chir', label: 'Chirurgien certifié',       icon: '🔪' },
    's2': { id: 'alien', label: 'Aliéniste certifié',       icon: '🧠' },
    's3': { id: 'pharma', label: 'Pharmacologue certifié',  icon: '💊' },
    's4': { id: 'epid', label: 'Épidémiologiste certifié',  icon: '🦠' },
    's5': { id: 'legal', label: 'Médecin légiste certifié', icon: '⚖️' },
  };

  if (passed && BADGE_MAP[examId]) {
    const badge = BADGE_MAP[examId];
    if (!badges.find(b => b.id === badge.id)) {
      badges.push({ ...badge, date: new Date().toISOString() });
    }
  }

  await updateDoc(ref, { examens, badges, updatedAt: serverTimestamp() });
}

/* ─── Vérifier si l'utilisateur est admin ────────────────── */
async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile && profile.role === 'admin';
}

/* ─── Observer l'état de connexion ──────────────────────── */
function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ─── Exposer sur window ────────────────────────────────── */
window._fbSignIn      = signInWithGoogle;
window._fbSignOut     = signOutUser;
window._fbGetProfile  = getCurrentProfile;
window._fbUpdateProfile = updateProfile;
window._fbSaveExam    = saveExamResult;
window._fbIsAdmin     = isAdmin;
window._fbOnReady     = onAuthReady;
window._fbAuth        = auth;
window._fbDb          = db;
