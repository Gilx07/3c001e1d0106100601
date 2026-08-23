(()=>{
  'use strict';

  if(!document.querySelector('link[href="css/navigation.css"]')){
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href='css/navigation.css';
    document.head.appendChild(stylesheet);
  }

  const make=(tag,className,text)=>{
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  };

  const items=[['home','Home'],['blog','Blog'],['about','About']];
  const path=location.pathname.toLowerCase();
  const current=path.endsWith('/blog.html')?'blog':path.endsWith('/about.html')?'about':'home';

  let header=document.getElementById('site-header');
  if(!header){
    header=make('header','site-header');
    header.id='site-header';
    const nav=make('nav','site-nav');
    nav.setAttribute('aria-label','Navigasi utama');
    const brand=make('button','nav-brand','Dolenthis');
    brand.type='button';
    brand.dataset.navAction='home';
    brand.setAttribute('aria-label','Kembali ke halaman utama');
    const toggle=make('button','nav-toggle');
    toggle.id='nav-toggle';
    toggle.type='button';
    toggle.setAttribute('aria-label','Buka navigasi');
    toggle.setAttribute('aria-expanded','false');
    toggle.appendChild(make('span'));
    const linksWrap=make('div','nav-links');
    linksWrap.id='nav-links';
    nav.append(brand,toggle,linksWrap);
    header.appendChild(nav);
    document.body.appendChild(header);
  }

  const linksWrap=header.querySelector('.nav-links');
  if(linksWrap){
    linksWrap.replaceChildren(...items.map(([action,label])=>{
      const button=make('button',`nav-link${action===current?' active':''}`,label);
      button.type='button';
      button.dataset.navAction=action;
      if(action===current)button.setAttribute('aria-current','page');
      return button;
    }));
  }

  const toggle=document.getElementById('nav-toggle');
  const links=[...header.querySelectorAll('[data-nav-action]')];
  const hero=document.querySelector('.hero');

  const closeMenu=()=>{
    header.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Buka navigasi');
  };

  const pulse=element=>{
    if(!element)return;
    element.classList.remove('nav-target-pulse');
    void element.offsetWidth;
    element.classList.add('nav-target-pulse');
    setTimeout(()=>element.classList.remove('nav-target-pulse'),760);
  };

  const navigate=action=>{
    if(action==='home'){
      if(current==='home'){
        if(document.body.classList.contains('lock-focused'))document.getElementById('lock-close')?.click();
        pulse(hero);
      }else location.href='index.html';
      return;
    }
    if(action==='blog'){
      if(current!=='blog')location.href='blog.html';
      return;
    }
    if(action==='about'&&current!=='about')location.href='about.html';
  };

  toggle?.addEventListener('click',()=>{
    const open=!header.classList.contains('nav-open');
    header.classList.toggle('nav-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');
  });

  links.forEach(link=>link.addEventListener('click',()=>{
    closeMenu();
    navigate(link.dataset.navAction);
  }));

  document.addEventListener('pointerdown',event=>{
    if(header.classList.contains('nav-open')&&!header.contains(event.target))closeMenu();
  });
  addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>700)closeMenu();},{passive:true});
})();