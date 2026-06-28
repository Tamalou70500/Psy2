/* header.js — Navbar injectée sur toutes les pages */

(function(){
  var page = window.location.pathname.split('/').pop() || 'index.html';

  var links = [
    { href:'dossier_patient.html',   label:'Dossiers'    },
    { href:'lexique.html',    label:'Dictionnaire' },
    { href:'visite.html',     label:'Visite'      },
    { href:'cours.html',      label:'Cours & Spé' },
    { href:'examen.html',     label:'Examens'     },
    { href:'frise.html',        label:'Frise'        },
    { href:'mediatheque.html',  label:'Médiathèque'  },
    { href:'communaute.html',   label:'Communauté'   },
  ];

  var coursPages = ['cours.html','specialites.html'];
  var examPages  = ['examen.html','examen-spe.html'];

  var navLinks = links.map(function(l){
    var active = '';
    if(l.href === 'cours.html'  && coursPages.indexOf(page) >= 0) active = ' class="active"';
    else if(l.href === 'examen.html' && examPages.indexOf(page) >= 0) active = ' class="active"';
    else if(page === l.href) active = ' class="active"';
    return '<a href="'+l.href+'"'+active+'>'+l.label+'</a>';
  }).join('\n    ');

  var html = '<nav class="navbar" id="main-navbar">'
    + '\n  <a href="index.html" class="navbar-brand">Cabinet Médical</a>'
    + '\n  <button class="navbar-burger" id="nav-burger" aria-label="Menu" onclick="(function(){var n=document.getElementById(\'main-navbar\');n.classList.toggle(\'nav-open\');})()">'
    + '&#9776;</button>'
    + '\n  <div class="navbar-sep"></div>'
    + '\n  <div class="navbar-links" id="navbar-links">\n    ' + navLinks + '\n  </div>'
    + '\n  <div class="navbar-right" id="navbar-right">'
    + '\n    <span class="navbar-user" id="navbar-user"></span>'
    + '\n    <a href="admin.html" class="btn btn-sm" id="navbar-admin-btn" style="display:none;border-color:#c83030;color:#c83030">⚙️ Admin</a>'
    + '\n    <a href="profil.html" class="btn btn-sm btn-gold">Profil</a>'
    + '\n    <button class="btn btn-sm" id="logout-btn">Quitter</button>'
    + '\n  </div>'
    + '\n</nav>';

  var existing = document.querySelector('nav.navbar');
  if(existing){ existing.outerHTML = html; }
  else { document.body.insertAdjacentHTML('afterbegin', html); }

  document.addEventListener('DOMContentLoaded', function(){
    var lb = document.getElementById('logout-btn');
    if(lb) lb.onclick = function(){
      if(window._fbSignOut) window._fbSignOut();
      else window.location.href = 'login.html';
    };
  });

  /* Afficher le bouton Admin si chief ou admin — déclenché par guard.js via onReady */
  window._showAdminBtn = function(role){
    if(['admin','chief','chief_texas','chief_louisiane'].includes(role)){
      var btn = document.getElementById('navbar-admin-btn');
      if(btn){
        btn.style.display = 'inline-block';
        if(role === 'admin') btn.style.borderColor = '#c83030', btn.style.color = '#c83030';
      }
    }
  };
})();
