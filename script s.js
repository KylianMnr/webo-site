// WEBO site — interactions
(function(){
  var SB = "https://smgglunijtmftjchxdgy.supabase.co";

  // Nav mobile
  var burger = document.querySelector('.burger');
  var links  = document.querySelector('.nav-links');
  if (burger && links) {
    burger.setAttribute('aria-expanded','false');
    burger.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Reveal au scroll
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  // Compteur de risque
  var amt = document.getElementById('riskAmount');
  if (amt) {
    var target = 150000, cur = 0, step = target/60;
    var run = function(){
      cur += step; if (cur >= target) cur = target;
      amt.textContent = Math.round(cur).toLocaleString('fr-FR') + ' \u20AC';
      if (cur < target) requestAnimationFrame(run);
    };
    var seen = false;
    var io2 = new IntersectionObserver(function(en){
      en.forEach(function(e){ if (e.isIntersecting && !seen) { seen = true; run(); } });
    }, { threshold: .4 });
    io2.observe(amt);
  }

  // Annee footer
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // ANALYTICS
  (function(){
    var sid;
    try {
      sid = sessionStorage.getItem('webo_sid');
      if (!sid) { sid = Date.now().toString(36) + Math.random().toString(36).slice(2,10); sessionStorage.setItem('webo_sid', sid); }
    } catch(e){ sid = 'anon'; }
    var page = location.pathname.replace(/\/$/,'') || '/index.html';
    fetch(SB + '/functions/v1/track-visit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ page: page, referrer: document.referrer || '', session_id: sid }),
      keepalive: true
    }).catch(function(){});
  })();

  // SCANNER PUBLIC
  var scanBtn = document.getElementById('scan-btn');
  if (scanBtn) {
    var scanUrlEl  = document.getElementById('scan-url');
    var scanBtnTxt = document.getElementById('scan-btn-txt');
    var loading    = document.getElementById('scan-loading');
    var statusEl   = document.getElementById('scan-status');
    var errorEl    = document.getElementById('scan-error');
    var resultEl   = document.getElementById('scan-result');

    var STEPS = [
      'Chargement de votre site\u2026',
      'Analyse de la structure\u2026',
      'V\u00E9rification des contrastes\u2026',
      'Test de la navigation clavier\u2026',
      'Contr\u00F4le des formulaires\u2026',
      'Calcul du score\u2026'
    ];

    var runScan = function(){
      var url = (scanUrlEl.value || '').trim();
      if (!url) {
        errorEl.hidden = false;
        errorEl.textContent = 'Veuillez saisir l\u2019adresse de votre site.';
        scanUrlEl.focus();
        return;
      }
      errorEl.hidden = true;
      resultEl.hidden = true;
      loading.hidden = false;
      scanBtn.disabled = true;
      scanBtnTxt.textContent = 'Analyse en cours\u2026';

      var si = 0;
      statusEl.textContent = STEPS[0];
      var stepTimer = setInterval(function(){
        si = (si + 1) % STEPS.length;
        statusEl.textContent = STEPS[si];
      }, 1600);

      fetch(SB + '/functions/v1/public-scan', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ url: url })
      })
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, d:d}; }); })
      .then(function(res){
        clearInterval(stepTimer);
        loading.hidden = true;
        scanBtn.disabled = false;
        scanBtnTxt.textContent = 'Analyser mon site';

        if (!res.ok) {
          errorEl.hidden = false;
          errorEl.textContent = res.d.error || 'L\u2019analyse a \u00E9chou\u00E9. R\u00E9essayez ou contactez-nous.';
          return;
        }
        var d = res.d;

        var scoreEl = document.getElementById('scan-score');
        scoreEl.textContent = d.score;
        scoreEl.className = 'scan-score ' + (d.score < 50 ? 'bad' : d.score < 80 ? 'mid' : 'good');
        document.getElementById('scan-verdict').textContent = d.conformite;
        document.getElementById('scan-conforme').textContent = d.conforme + ' / ' + d.checks;
        document.getElementById('scan-cms').textContent = d.cms || '\u2014';
        document.getElementById('scan-pages').textContent = d.pages || '\u2014';

        var total = d.exposition + (d.exposition_declaration || 0);
        document.getElementById('scan-amount').textContent = total.toLocaleString('fr-FR') + ' \u20AC';

        var detail = 'Amende de 50 000 \u20AC par service non conforme, renouvelable tous les 6 mois.';
        if (d.exposition_declaration > 0) detail += ' S\u2019y ajoutent 25 000 \u20AC pour l\u2019absence de d\u00E9claration d\u2019accessibilit\u00E9.';
        detail += ' Chaque canal (site, application, espace client) est sanctionn\u00E9 s\u00E9par\u00E9ment.';
        document.getElementById('scan-amount-detail').textContent = detail;

        var list = document.getElementById('scan-errors-list');
        list.innerHTML = '';
        if (d.erreurs && d.erreurs.length) {
          d.erreurs.forEach(function(e){
            var li = document.createElement('li');
            li.textContent = e;
            list.appendChild(li);
          });
        } else {
          var li = document.createElement('li');
          li.textContent = 'Aucune non-conformit\u00E9 d\u00E9tect\u00E9e par l\u2019analyse automatis\u00E9e. Un audit manuel reste n\u00E9cessaire pour les 106 crit\u00E8res du RGAA.';
          li.style.color = '#4CAF7D';
          list.appendChild(li);
        }
        resultEl.hidden = false;
        resultEl.scrollIntoView({behavior:'smooth', block:'nearest'});
      })
      .catch(function(){
        clearInterval(stepTimer);
        loading.hidden = true;
        scanBtn.disabled = false;
        scanBtnTxt.textContent = 'Analyser mon site';
        errorEl.hidden = false;
        errorEl.textContent = 'Connexion impossible. V\u00E9rifiez votre r\u00E9seau et r\u00E9essayez.';
      });
    };

    scanBtn.addEventListener('click', runScan);
    scanUrlEl.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); runScan(); }
    });
  }

  // FORMULAIRE DE CONTACT -> CRM
  var form = document.getElementById('contactForm');
  if (form) {
    var submitBtn = form.querySelector('button[type=submit]') || form.querySelector('.btn-primary');
    var origTxt = submitBtn ? submitBtn.innerHTML : '';

    var fb = document.createElement('div');
    fb.className = 'form-feedback';
    fb.setAttribute('role','status');
    fb.setAttribute('aria-live','polite');
    fb.hidden = true;
    form.appendChild(fb);

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var d = new FormData(form);
      var payload = {
        nom:        (d.get('nom') || '').trim(),
        entreprise: (d.get('entreprise') || '').trim(),
        email:      (d.get('email') || '').trim(),
        tel:        (d.get('tel') || '').trim(),
        site:       (d.get('site') || '').trim(),
        message:    (d.get('message') || '').trim()
      };
      if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) {
        fb.hidden = false;
        fb.className = 'form-feedback err';
        fb.textContent = 'Veuillez saisir une adresse e-mail valide.';
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Envoi en cours\u2026';
      }
      fb.hidden = true;

      fetch(SB + '/functions/v1/contact-form', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); })
      .then(function(res){
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origTxt; }
        if (!res.ok) throw new Error(res.j.error || 'Erreur');
        fb.hidden = false;
        fb.className = 'form-feedback ok';
        fb.textContent = 'Message bien re\u00E7u. Nous vous recontactons sous 24 h ouvr\u00E9es.';
        form.reset();
      })
      .catch(function(){
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origTxt; }
        fb.hidden = false;
        fb.className = 'form-feedback err';
        fb.innerHTML = 'L\u2019envoi a \u00E9chou\u00E9. \u00C9crivez-nous \u00E0 <a href="mailto:kmeunier@webo-smart.fr">kmeunier@webo-smart.fr</a>.';
      });
    });
  }
})();
