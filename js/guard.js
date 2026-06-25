/* guard.js — Protection des pages selon le grade + rôle chief
   Inclure APRÈS auth-firebase.js sur chaque page protégée */

var GRADE_LABELS = {
  stagiaire:   '🎓 Stagiaire',
  apprenti:    '🩺 Apprenti médecin',
  medecin:     '👨‍⚕️ Médecin',
  specialiste: '⭐ Spécialiste',
  chief:       '🏛️ Chef de cabinet',
  admin:       '⚙️ Administrateur'
};

/* Niveau numérique de chaque grade */
var GRADE_LEVEL = {
  stagiaire:0, apprenti:1, medecin:2, specialiste:3, chief:90, admin:99
};

/* Vrai grade effectif tenant compte du rôle */
function effectiveGrade(p){
  if(p.role === 'admin')  return 'admin';
  if(p.role === 'chief')  return 'chief';
  return p.grade || 'stagiaire';
}

/* Expose globalement pour les pages */
window.GRADE_LABELS = GRADE_LABELS;
window.GRADE_LEVEL  = GRADE_LEVEL;
window.effectiveGrade = effectiveGrade;

window.guardPage = function(opts){
  var minGrade      = (opts && opts.minGrade)      || 'stagiaire';
  var requirePatients = (opts && opts.requirePatients) || false;

  var waitG = setInterval(function(){
    if(!window._fbOnReady) return;
    clearInterval(waitG);
    window._fbOnReady(function(user){
      if(!user){ window.location.href='login.html'; return; }

      window._fbGetProfile().then(async function(p){
        /* Créer profil minimal si absent */
        if(!p){
          if(window._fbAuth && window._fbAuth.currentUser){
            var u = window._fbAuth.currentUser;
            await window._fbUpdateProfile({
              uid:u.uid, email:u.email,
              nom:'', prenom:'', photo:u.photoURL||'',
              age:'', cabinet:'Sunset', grade:'stagiaire',
              role:'medecin', badges:[], examens:{},
              profilOk:false, accesPatients:false
            });
            p = await window._fbGetProfile();
          }
          if(!p){ window.location.href='login.html'; return; }
        }

        /* Profil incomplet */
        if(!p.profilOk){ window.location.href='setup-profil.html'; return; }

        var eg       = effectiveGrade(p);
        var userLvl  = GRADE_LEVEL[eg] ?? 0;
        var minLvl   = GRADE_LEVEL[minGrade] ?? 0;

        /* Grade insuffisant */
        if(userLvl < minLvl){
          document.body.innerHTML = `
            <nav class="navbar"><span class="navbar-brand">Cabinet Médical</span>
            <div class="navbar-right"><button class="btn btn-sm" onclick="window._fbSignOut()">Quitter</button></div></nav>
            <div style="max-width:500px;margin:4rem auto;padding:2rem;text-align:center">
              <div style="font-size:2rem;margin-bottom:1rem">🔒</div>
              <h2 style="font-family:'Playfair Display',serif;color:var(--parch);margin-bottom:1rem">Accès restreint</h2>
              <p style="font-family:'EB Garamond',serif;color:var(--parch3);line-height:1.7">
                Cette section nécessite le grade <strong style="color:var(--gold)">${GRADE_LABELS[minGrade]||minGrade}</strong>.<br>
                Votre grade actuel : <strong>${GRADE_LABELS[eg]||eg}</strong>.<br><br>
                Réussissez les examens pour progresser.
              </p>
              <a href="cours.html" class="btn btn-gold" style="margin-top:1.5rem;display:inline-block">Aller aux cours →</a>
            </div>`;
          return;
        }

        /* Accès dossiers patients requis */
        if(requirePatients && !p.accesPatients && eg !== 'admin' && eg !== 'chief'){
          document.body.innerHTML = `
            <nav class="navbar"><a href="index.html" class="navbar-brand">Cabinet Médical</a>
            <div class="navbar-right"><button class="btn btn-sm" onclick="window._fbSignOut()">Quitter</button></div></nav>
            <div style="max-width:520px;margin:4rem auto;padding:2rem;text-align:center">
              <div style="font-size:2.5rem;margin-bottom:1rem">📋</div>
              <h2 style="font-family:'Playfair Display',serif;color:var(--parch);margin-bottom:.75rem;font-style:italic">
                Accès aux dossiers en attente
              </h2>
              <p style="font-family:'EB Garamond',serif;color:var(--parch3);line-height:1.8">
                L'accès aux dossiers patients est accordé par le <strong style="color:var(--gold)">Chef de cabinet</strong>
                ou un <strong style="color:var(--gold)">Administrateur</strong>.<br><br>
                Votre demande est en attente de validation.
                Contactez votre supérieur hiérarchique en jeu pour obtenir l'accès.
              </p>
              <div style="margin-top:1.5rem;display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
                <a href="cours.html"      class="btn btn-gold">Continuer la formation →</a>
                <a href="communaute.html" class="btn">Communauté</a>
              </div>
            </div>`;
          return;
        }

        /* Synchroniser scores Firebase → localStorage */
        if(p.examens){
          var scores = {};
          Object.entries(p.examens).forEach(function(kv){
            scores[kv[0]] = { pct:kv[1].pct, passed:kv[1].passed, date:kv[1].date };
          });
          localStorage.setItem('psy_exam_scores', JSON.stringify(scores));
        } else {
          localStorage.removeItem('psy_exam_scores');
        }

        /* Remplir navbar */
        var nb = document.getElementById('navbar-user');
        if(nb) nb.textContent = (p.prenom||'')+' '+(p.nom||'')+' · '+(GRADE_LABELS[eg]||'');

        /* Badge notifications pour chief/admin */
        if(eg === 'admin' || eg === 'chief'){
          _checkPendingAccess(p);
        }

        /* Bouton déconnexion */
        var lb = document.getElementById('logout-btn');
        if(lb) lb.onclick = function(){ window._fbSignOut(); };

        /* Callback */
        if(opts && opts.onReady) opts.onReady(p);
      });
    });
  }, 80);
};

/* Badge notification — demandes d'accès en attente */
function _checkPendingAccess(currentUser){
  if(!window._fbDb) return;
  // Compter les médecins sans accesPatients
  // On le fait via un appel léger à Firestore
  setTimeout(function(){
    if(!window._fbDb) return;
    try {
      var { collection, getDocs, query, where } = window._fbFirestoreUtils || {};
      if(!getDocs) return;
      getDocs(query(
        collection(window._fbDb, 'medecins'),
        where('profilOk', '==', true),
        where('accesPatients', '==', false)
      )).then(function(snap){
        var count = snap.size;
        if(count > 0){
          var badge = document.getElementById('navbar-pending-badge');
          if(!badge){
            var adminLink = document.querySelector('a[href="admin.html"]');
            if(adminLink){
              badge = document.createElement('span');
              badge.id = 'navbar-pending-badge';
              badge.style.cssText = 'background:#c83030;color:#fff;font-size:.55rem;padding:1px 5px;border-radius:10px;margin-left:4px;font-family:Courier Prime,monospace;';
              badge.textContent = count;
              adminLink.appendChild(badge);
            }
          } else {
            badge.textContent = count;
          }
        }
      }).catch(function(){});
    } catch(e){}
  }, 1500);
}
