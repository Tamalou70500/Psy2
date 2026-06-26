/* ═══════════════════════════════════════════════════════════
   auth-firebase.js — Auth Google + Email/Mdp + Profils — v4
═══════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs, serverTimestamp
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

/* ─── Créer profil si inexistant ────────────────────────── */
async function ensureProfile(user) {
  const ref  = doc(db, 'medecins', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:           user.uid,
      email:         user.email || '',
      nom:           '',
      prenom:        '',
      photo:         user.photoURL || '',
      age:           '',
      cabinet:       'Sunset',
      grade:         'stagiaire',
      role:          'medecin',
      badges:        [],
      examens:       {},
      profilOk:      false,
      accesPatients: false,
      createdAt:     serverTimestamp()
    });
    return null;
  }
  return snap.data();
}

/* ─── Connexion Google ───────────────────────────────────── */
async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const profil = await ensureProfile(result.user);
  return { user: result.user, profil };
}

/* ─── Connexion Email/Mot de passe ──────────────────────── */
async function signInWithEmail(identifier, password) {
  // Transformer l'identifiant en email valide pour Firebase
  // (Firebase exige un format email même pour un pseudo)
  // Normaliser l'identifiant en email Firebase-compatible
  let email;
  if(identifier.includes('@')) {
    email = identifier.trim().toLowerCase();
  } else {
    // Nettoyer : garder lettres, chiffres, tirets, underscores
    const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    email = clean + '@cabinet-medical-rp.com';
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profil = await ensureProfile(result.user);
    return { user: result.user, profil };
  } catch (e) {
    if (e.code === 'auth/user-not-found' 
      || e.code === 'auth/invalid-credential'
      || e.code === 'auth/invalid-email'
      || e.code === 'auth/wrong-password'
      || (e.message && e.message.includes('INVALID_LOGIN_CREDENTIALS'))) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }
    throw e;
  }
}

/* ─── Créer un compte Email/Mot de passe ────────────────── */
async function createAccountWithEmail(identifier, password) {
  // Normaliser l'identifiant en email Firebase-compatible
  let email;
  if(identifier.includes('@')) {
    email = identifier.trim().toLowerCase();
  } else {
    // Nettoyer : garder lettres, chiffres, tirets, underscores
    const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    email = clean + '@cabinet-medical-rp.com';
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureProfile(result.user);
    return { user: result.user, profil: null };
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      throw new Error('Cet identifiant est déjà utilisé. Essayez de vous connecter.');
    }
    if (e.code === 'auth/weak-password') {
      throw new Error('Mot de passe trop court — minimum 6 caractères.');
    }
    throw e;
  }
}

/* ─── Déconnexion ────────────────────────────────────────── */
async function signOutUser() {
  localStorage.removeItem('psy_exam_scores');
  await signOut(auth);
  window.location.href = "login.html";
}

/* ─── Récupérer le profil courant ───────────────────────── */
async function getProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'medecins', user.uid));
  return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
}

/* ─── Mettre à jour le profil ───────────────────────────── */
async function updateProfile(data) {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, 'medecins', user.uid), data, { merge: true });
}

/* ─── Lister tous les médecins ──────────────────────────── */
async function getAllMedecins() {
  const snap = await getDocs(collection(db, 'medecins'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}
window._fbGetAllMedecins = getAllMedecins;

/* ─── Observer auth ─────────────────────────────────────── */
window._fbOnReady = (cb) => onAuthStateChanged(auth, cb);
window._fbSignIn  = signInWithGoogle;
window._fbSignInEmail  = signInWithEmail;
window._fbCreateEmail  = createAccountWithEmail;
window._fbSignOut = signOutUser;
window._fbGetProfile   = getProfile;
window._fbUpdateProfile = updateProfile;
window._fbAuth    = auth;
window._fbDb      = db;

// Exposer Firestore utils pour guard.js
window._fbFirestoreUtils = { collection, query, where, getDocs, doc, getDoc };
