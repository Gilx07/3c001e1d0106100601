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

  let qrModal=null;
  let qrClose=null;
  let qrModalImage=null;
  let qrModalName=null;
  let qrModalAddress=null;

  const closeQrModal=()=>{
    if(!qrModal||!qrModal.classList.contains('is-open'))return;
    qrModal.classList.remove('is-open');
    qrModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('crypto-modal-open');
  };

  const makeElement=(tag,className)=>{
    const element=document.createElement(tag);
    if(className)element.className=className;
    return element;
  };

  const ensureQrModal=()=>{
    if(qrModal)return qrModal;

    qrModal=makeElement('div','crypto-modal');
    qrModal.setAttribute('aria-hidden','true');

    const panel=makeElement('div','crypto-modal-panel');
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-labelledby','crypto-modal-name');

    qrClose=makeElement('button','crypto-modal-close');
    qrClose.type='button';
    qrClose.setAttribute('aria-label','Tutup');
    qrClose.textContent='×';

    qrModalImage=makeElement('img','crypto-modal-qr');
    qrModalImage.alt='';

    const info=makeElement('div','crypto-modal-info');
    qrModalName=makeElement('div','crypto-modal-name');
    qrModalName.id='crypto-modal-name';
    qrModalAddress=makeElement('div','crypto-modal-address');

    info.append(qrModalName,qrModalAddress);
    panel.append(qrClose,qrModalImage,info);
    qrModal.append(panel);
    document.body.append(qrModal);

    qrClose.addEventListener('click',closeQrModal);
    qrModal.addEventListener('click',event=>{if(event.target===qrModal)closeQrModal();});
    return qrModal;
  };

  document.querySelectorAll('.crypto-qr').forEach(image=>{
    image.setAttribute('role','button');
    image.setAttribute('tabindex','0');
    image.setAttribute('aria-label','Perbesar informasi wallet');

    const openModal=event=>{
      event.preventDefault();
      event.stopPropagation();

      const card=image.closest('.crypto-card');
      if(!card)return;

      ensureQrModal();
      const name=card.querySelector('.crypto-name')?.textContent?.trim()||'Wallet';
      const address=card.querySelector('.crypto-address')?.textContent?.trim()||'';
      const source=image.getAttribute('src')||image.src;

      qrModalImage.setAttribute('src',source);
      qrModalImage.alt=`QR ${name}`;
      qrModalName.textContent=name;
      qrModalAddress.textContent=address;
      qrModal.classList.add('is-open');
      qrModal.setAttribute('aria-hidden','false');
      document.body.classList.add('crypto-modal-open');
      requestAnimationFrame(()=>qrClose?.focus());
    };

    image.addEventListener('click',openModal);
    image.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();openModal(event);}
    });
  });

  const block=event=>event.preventDefault();
  document.addEventListener('copy',block);
  document.addEventListener('cut',block);
  document.addEventListener('contextmenu',block);
  document.addEventListener('dragstart',block);
  document.addEventListener('selectstart',block);

  addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(qrModal?.classList.contains('is-open')){closeQrModal();return;}
      closeMenu();
      return;
    }

    const key=event.key.toLowerCase();
    const modifier=event.ctrlKey||event.metaKey;
    if(modifier&&['a','c','x','s','p','u'].includes(key)){
      event.preventDefault();
      return;
    }
    if(modifier&&event.shiftKey&&['i','j','c'].includes(key)){
      event.preventDefault();
      return;
    }
    if(event.key==='F12')event.preventDefault();
  },true);

  addEventListener('resize',()=>{if(innerWidth>700)closeMenu();},{passive:true});
})();
