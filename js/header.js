/* header.js — Navbar identique injectée sur toutes les pages
   Inclure dans <body> avec <script src="js/header.js"></script>
   La navbar remplace automatiquement le premier <nav class="navbar"> trouvé */

(function(){
  var page = window.location.pathname.split('/').pop() || 'index.html';

  var links = [
    { href:'annuaire.html', label:'Dossiers' },
    { href:'lexique.html',  label:'Lexique'  },
    { href:'visite.html',   label:'Visite'   },
    { href:'cours.html',    label:'Cours'    },
    { href:'examen.html',   label:'Examens'  },
  ];

  var navLinks = links.map(function(l){
    var active = page === l.href ? ' class="active"' : '';
    return '<a href="'+l.href+'"'+active+'>'+l.label+'</a>';
  }).join('\n    ');

  var html = '<nav class="navbar">'
    + '\n  <span class="navbar-brand">Dr. Abernathy Lucius</span>'
    + '\n  <div class="navbar-sep"></div>'
    + '\n  <div class="navbar-links">\n    ' + navLinks + '\n  </div>'
    + '\n  <div class="navbar-right">'
    + '\n    <span class="navbar-user" id="navbar-user"></span>'
    + '\n    <a href="themes.html" class="btn btn-sm" title="Thèmes &amp; polices">🎨</a>'
    + '\n    <a href="profil.html" class="btn btn-sm btn-gold">Mon profil</a>'
    + '\n    <button class="btn btn-sm" id="logout-btn">Quitter</button>'
    + '\n  </div>'
    + '\n</nav>';

  // Remplacer la navbar existante ou insérer au début du body
  var existing = document.querySelector('nav.navbar');
  if(existing){
    existing.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // Bouton quitter
  document.addEventListener('DOMContentLoaded', function(){
    var lb = document.getElementById('logout-btn');
    if(lb) lb.onclick = function(){ if(window._fbSignOut) window._fbSignOut(); else window.location.href='login.html'; };
  });
})();
