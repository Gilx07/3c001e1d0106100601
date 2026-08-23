(()=>{
  'use strict';

  const header=document.getElementById('site-header');
  if(!header)return;

  const toggle=document.getElementById('nav-toggle');
  const links=[...header.querySelectorAll('.nav-link')];
  const path=location.pathname.replace(/\/+$/,'').toLowerCase();
  const current=path.endsWith('/blog.html')||path.includes('/blog-')?'blog':path.endsWith('/about.html')?'about':'home';

  links.forEach(link=>{
    const action=link.dataset.navAction;
    const active=action===current;
    link.classList.toggle('active',active);
    if(active)link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });

  const closeMenu=()=>{
    header.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Buka navigasi');
  };

  toggle?.addEventListener('click',()=>{
    const open=!header.classList.contains('nav-open');
    header.classList.toggle('nav-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');
  });

  links.forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('pointerdown',event=>{
    if(header.classList.contains('nav-open')&&!header.contains(event.target))closeMenu();
  });
  addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>700)closeMenu();},{passive:true});
})();
