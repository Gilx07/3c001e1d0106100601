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

    const items=[
      ['home','Home'],
      ['book','Book'],
      ['pinlock','Pin Lock'],
      ['lamp','Lamp']
    ];
    items.forEach(([action,label],index)=>{
      const button=make('button',`nav-link${index===0?' active':''}`,label);
      button.type='button';
      button.dataset.navAction=action;
      linksWrap.appendChild(button);
    });

    nav.append(brand,toggle,linksWrap);
    header.appendChild(nav);
    document.body.appendChild(header);
  }

  const toggle=document.getElementById('nav-toggle');
  const links=[...header.querySelectorAll('[data-nav-action]')];
  const book=document.getElementById('ancient-book');
  const lockbox=document.getElementById('lockbox');
  const lamp=document.getElementById('desk-lamp');
  const hero=document.querySelector('.hero');

  const closeMenu=()=>{
    header.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded','false');
  };

  const pulse=element=>{
    if(!element)return;
    element.classList.remove('nav-target-pulse');
    void element.offsetWidth;
    element.classList.add('nav-target-pulse');
    setTimeout(()=>element.classList.remove('nav-target-pulse'),760);
  };

  const setActive=button=>{
    const action=button?.dataset.navAction;
    header.querySelectorAll('.nav-link').forEach(link=>link.classList.toggle('active',link.dataset.navAction===action));
  };

  function runAction(action,button){
    closeMenu();
    setActive(button);
    if(action==='home'){
      if(document.body.classList.contains('lock-focused'))document.getElementById('lock-close')?.click();
      pulse(hero);
      return;
    }
    if(action==='book'){
      pulse(book);
      book?.querySelector('.book-page')?.focus({preventScroll:true});
      return;
    }
    if(action==='pinlock'){
      if(!document.body.classList.contains('lock-focused'))lockbox?.click();
      return;
    }
    if(action==='lamp'){
      pulse(lamp);
      lamp?.focus({preventScroll:true});
    }
  }

  toggle?.addEventListener('click',()=>{
    const open=!header.classList.contains('nav-open');
    header.classList.toggle('nav-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');
  });

  links.forEach(link=>link.addEventListener('click',()=>runAction(link.dataset.navAction,link)));

  document.addEventListener('pointerdown',event=>{
    if(header.classList.contains('nav-open')&&!header.contains(event.target))closeMenu();
  });
  addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>700)closeMenu();},{passive:true});
})();