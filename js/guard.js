/* guard.js — Protection des pages selon le grade + rôle chief
   Inclure APRÈS auth-firebase.js sur chaque page protégée */

var GRADE_LABELS = {
  stagiaire:        '🎓 Stagiaire',
  apprenti:         '🩺 Apprenti médecin',
  medecin:          '👨‍⚕️ Médecin',
  specialiste:      '⭐ Spécialiste',
  chief:            '🏛️ Chef de dispensaire',
  chief_texas:      '🤠 Chief du Texas',
  chief_louisiane:  '⚜️ Chief de Louisiane',
  admin:            '⚙️ Administrateur'
};

/* Niveau numérique de chaque rôle */
var GRADE_LEVEL = {
  stagiaire:0, apprenti:1, medecin:2, specialiste:3,
  chief:90, chief_texas:91, chief_louisiane:91, admin:99
};

/* Rôle effectif — champ unique */
function effectiveGrade(p){
  return p.role || 'stagiaire';
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
              age:'', cabinet:'Sunset',
              role:'stagiaire', badges:[], examens:{},
              profilOk:false, accesPatients:false
            });
            p = await window._fbGetProfile();
          }
          if(!p){ window.location.href='login.html'; return; }
        }

        /* Profil incomplet */
        if(!p.profilOk){
          if(opts && opts.allowIncomplete){
            /* Page libre : accès autorisé, navbar minimale */
            var nb = document.getElementById('navbar-user');
            if(nb) nb.textContent = 'Nouveau membre';
            var lb = document.getElementById('logout-btn');
            if(lb) lb.onclick = function(){ window._fbSignOut(); };
            if(opts.onReady) opts.onReady(p);
            return;
          }
          if(opts && opts.popupIfIncomplete){
            /* Popup invitation à compléter le profil */
            var overlay = document.createElement('div');
            overlay.id = 'profil-incomplete-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:flex;align-items:center;justify-content:center';
            overlay.innerHTML = `
              <div style="background:#1c1409;border:1px solid #6b4f1e;border-radius:10px;max-width:440px;width:90%;padding:2rem;text-align:center;font-family:'Cormorant Garamond',serif">
                <div style="font-size:2.2rem;margin-bottom:.75rem">📋</div>
                <h2 style="font-family:'Playfair Display',serif;color:#c9a84c;margin:0 0 .75rem;font-size:1.3rem">Fiche de personnage incomplète</h2>
                <p style="color:#e8d9b8;line-height:1.8;font-size:.95rem;margin:0 0 1.5rem">
                  Pour accéder à cette section, vous devez d'abord remplir votre fiche de personnage —
                  <strong>prénom, nom RP, âge et cabinet</strong>.
                </p>
                <a href="profil.html" style="display:inline-block;padding:.6rem 1.4rem;background:#c9a84c;color:#1c1409;border-radius:5px;font-family:'Playfair Display',serif;font-size:.95rem;text-decoration:none;font-weight:700">Compléter ma fiche →</a>
                <br>
                <button onclick="window._fbSignOut()" style="margin-top:1rem;background:none;border:none;color:#a08060;font-size:.8rem;cursor:pointer;font-family:'Cormorant Garamond',serif">Se déconnecter</button>
              </div>`;
            document.body.appendChild(overlay);
            /* Remplir quand même la navbar */
            var nb2 = document.getElementById('navbar-user');
            if(nb2) nb2.textContent = 'Nouveau membre';
            return;
          }
          window.location.href='setup-profil.html'; return;
        }

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

        /* Synchroniser scores Firebase → localStorage (seulement si Firestore a des données) */
        if(p.examens && Object.keys(p.examens).length > 0){
          var scores = {};
          Object.entries(p.examens).forEach(function(kv){
            scores[kv[0]] = { pct:kv[1].pct, passed:kv[1].passed, date:kv[1].date };
          });
          localStorage.setItem('psy_exam_scores', JSON.stringify(scores));
        }

        /* Remplir navbar */
        var nb = document.getElementById('navbar-user');
        if(nb) nb.textContent = (p.prenom||'')+' '+(p.nom||'')+' · '+(GRADE_LABELS[eg]||'');

        /* Afficher bouton Admin si chief ou admin */
        if(window._showAdminBtn) window._showAdminBtn(p.role);

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
