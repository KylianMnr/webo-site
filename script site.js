// WEBO site — interactions
(function(){
  // Nav mobile
  var burger=document.querySelector('.burger');
  var links=document.querySelector('.nav-links');
  if(burger&&links){burger.addEventListener('click',function(){links.classList.toggle('open')})}

  // Reveal au scroll
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  // Compteur de risque animé (page d'accueil)
  var amt=document.getElementById('riskAmount');
  if(amt){
    var target=150000,cur=0,step=target/60;
    var run=function(){cur+=step;if(cur>=target){cur=target}amt.textContent=Math.round(cur).toLocaleString('fr-FR')+' €';if(cur<target)requestAnimationFrame(run)};
    var seen=false;
    var io2=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting&&!seen){seen=true;run()}})},{threshold:.4});
    io2.observe(amt);
  }

  // Année footer
  var yr=document.getElementById('year');if(yr)yr.textContent=new Date().getFullYear();

  // Formulaire contact (mailto fallback)
  var form=document.getElementById('contactForm');
  if(form){form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var d=new FormData(form);
    var body='Nom: '+(d.get('nom')||'')+'%0D%0AEntreprise: '+(d.get('entreprise')||'')+'%0D%0AEmail: '+(d.get('email')||'')+'%0D%0ATéléphone: '+(d.get('tel')||'')+'%0D%0A%0D%0A'+(d.get('message')||'');
    window.location.href='mailto:contact@webo-smart.fr?subject=Demande de RDV EAA — '+(d.get('entreprise')||'')+'&body='+body;
  })}
})();
