(()=>{
  'use strict';

  if(!document.querySelector('link[href="css/navigation.css"]')){
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href='css/navigation.css';
    document.head.appendChild(stylesheet);
  }

  let header=document.getElementById('site-header');
  if(!header){
    header=document.createElement('header');
    header.className='site-header';
    header.id='site-header';
    header.innerHTML=`
      <nav class="site-nav" aria-label="Navigasi utama">
        <button class="nav-brand" type="button" data-nav-action="home" aria-label="Kembali ke halaman utama">Dolenthis</button>
        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Buka navigasi" aria-expanded="false"><span></span></button>
        <div class="nav-links" id="nav-links">
          <button class="nav-link active" type="button" data-nav-action="home">Home</button>
          <button class="nav-link" type="button" data-nav-action="book">Book</button>
          <button class="nav-link" type="button" data-nav-action="pinlock">Pin Lock</button>
          <button class="nav-link" type="button" data-nav-action="lamp">Lamp</button>
        </div>
      </nav>`;
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
  });

  links.forEach(link=>link.addEventListener('click',()=>runAction(link.dataset.navAction,link)));

  document.addEventListener('pointerdown',event=>{
    if(header.classList.contains('nav-open')&&!header.contains(event.target))closeMenu();
  });
  addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>700)closeMenu();},{passive:true});
})();
