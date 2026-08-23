(()=>{
  'use strict';

  const header=document.getElementById('site-header');
  const toggle=document.getElementById('nav-toggle');
  const links=[...document.querySelectorAll('[data-nav-action]')];
  const book=document.getElementById('ancient-book');
  const lockbox=document.getElementById('lockbox');
  const lamp=document.getElementById('desk-lamp');
  const hero=document.querySelector('.hero');
  if(!header)return;

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
    links.forEach(link=>link.classList.toggle('active',link===button));
  };

  function runAction(action,button){
    closeMenu();
    setActive(button);
    if(action==='home'){
      document.getElementById('lock-close')?.click();
      pulse(hero);
      return;
    }
    if(action==='book'){
      pulse(book);
      book?.querySelector('.book-page')?.focus({preventScroll:true});
      return;
    }
    if(action==='pinlock'){
      if(!document.body.classList.contains('lock-focused')) lockbox?.click();
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
  });

  links.forEach(link=>link.addEventListener('click',()=>runAction(link.dataset.navAction,link)));

  document.addEventListener('pointerdown',event=>{
    if(header.classList.contains('nav-open')&&!header.contains(event.target))closeMenu();
  });

  addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>700)closeMenu();},{passive:true});
})();
