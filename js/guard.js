/* guard.js — Protection des pages selon le grade
   Inclure APRÈS auth-firebase.js sur chaque page protégée */

var GRADE_LABELS = {
  stagiaire:   '🎓 Stagiaire',
  apprenti:    '🩺 Apprenti médecin',
  medecin:     '👨‍⚕️ Médecin',
  specialiste: '⭐ Spécialiste',
  admin:       '⚙️ Administrateur'
};

window.guardPage = function(opts){
  /* opts: { minGrade, onReady } */
  var minGrade = opts?.minGrade || 'stagiaire';
  var GRADE_LEVEL = { stagiaire:0, apprenti:1, medecin:2, specialiste:3, admin:99 };

  var waitG = setInterval(function(){
    if(!window._fbOnReady) return;
    clearInterval(waitG);
    window._fbOnReady(function(user){
      if(!user){ window.location.href='login.html'; return; }

      // Vider les scores localStorage — utiliser uniquement Firebase
      window._fbGetProfile().then(async function(p){
        // Si pas de profil, le créer (cas utilisateur déjà connecté sans avoir signé)
        if(!p){
          if(window._fbAuth && window._fbAuth.currentUser){
            var u = window._fbAuth.currentUser;
            await window._fbUpdateProfile({
              uid: u.uid, email: u.email,
              nom:'', prenom:'', photo: u.photoURL||'',
              age:'', cabinet:'Sunset', grade:'stagiaire',
              role:'medecin', badges:[], examens:{}, profilOk:false
            });
            p = await window._fbGetProfile();
          }
          if(!p){ window.location.href='login.html'; return; }
        }

        // Profil incomplet → setup
        if(!p.profilOk){ window.location.href='setup-profil.html'; return; }

        // Grade insuffisant
        var userLevel = GRADE_LEVEL[p.role==='admin'?'admin':(p.grade||'stagiaire')];
        var minLevel  = GRADE_LEVEL[minGrade] ?? 0;
        if(userLevel < minLevel){
          document.body.innerHTML = `
            <nav class="navbar"><span class="navbar-brand">Dr. Abernathy Lucius</span>
            <div class="navbar-right"><button class="btn btn-sm" onclick="window._fbSignOut()">Quitter</button></div></nav>
            <div style="max-width:500px;margin:4rem auto;padding:2rem;text-align:center">
              <div style="font-size:2rem;margin-bottom:1rem">🔒</div>
              <h2 style="font-family:'Playfair Display',serif;color:var(--parch);margin-bottom:1rem">Accès restreint</h2>
              <p style="font-family:'EB Garamond',serif;color:var(--parch3);line-height:1.7">
                Cette section nécessite le grade <strong style="color:var(--gold)">${GRADE_LABELS[minGrade]||minGrade}</strong>.<br>
                Votre grade actuel : <strong>${GRADE_LABELS[p.grade||'stagiaire']||p.grade}</strong>.<br><br>
                Réussissez les examens pour progresser.
              </p>
              <a href="cours.html" class="btn btn-gold" style="margin-top:1.5rem;display:inline-block">Aller aux cours →</a>
            </div>`;
          return;
        }

        // Synchroniser scores Firebase → localStorage
        if(p.examens){
          var scores = {};
          Object.entries(p.examens).forEach(function(kv){
            scores[kv[0]] = { pct: kv[1].pct, passed: kv[1].passed, date: kv[1].date };
          });
          localStorage.setItem('psy_exam_scores', JSON.stringify(scores));
        } else {
          localStorage.removeItem('psy_exam_scores');
        }

        // Remplir navbar user
        var nb = document.getElementById('navbar-user');
        if(nb) nb.textContent = (p.prenom||'')+' '+(p.nom||'')+' · '+(GRADE_LABELS[p.grade||'stagiaire']||'');

        // Bouton déconnexion
        var lb = document.getElementById('logout-btn');
        if(lb) lb.onclick = function(){ window._fbSignOut(); };

        // Callback
        if(opts?.onReady) opts.onReady(p);
      });
    });
  }, 80);
};
