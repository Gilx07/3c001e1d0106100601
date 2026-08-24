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
  const closeQrModal=()=>{
    if(!qrModal||!qrModal.classList.contains('is-open'))return;
    qrModal.classList.remove('is-open');
    qrModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('crypto-modal-open');
  };

  const ensureQrModal=()=>{
    if(qrModal)return qrModal;
    qrModal=document.createElement('div');
    qrModal.className='crypto-modal';
    qrModal.setAttribute('aria-hidden','true');
    qrModal.innerHTML='<div class="crypto-modal-panel" role="dialog" aria-modal="true" aria-labelledby="crypto-modal-name"><button class="crypto-modal-close" type="button" aria-label="Tutup">×</button><img class="crypto-modal-qr" alt=""><div class="crypto-modal-info"><div class="crypto-modal-name" id="crypto-modal-name"></div><div class="crypto-modal-address"></div></div></div>';
    document.body.appendChild(qrModal);
    qrClose=qrModal.querySelector('.crypto-modal-close');
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
      const modal=ensureQrModal();
      const name=card.querySelector('.crypto-name')?.textContent?.trim()||'Wallet';
      const address=card.querySelector('.crypto-address')?.textContent?.trim()||'';
      const modalImage=modal.querySelector('.crypto-modal-qr');
      modalImage.src=image.src;
      modalImage.alt=`QR ${name}`;
      modal.querySelector('.crypto-modal-name').textContent=name;
      modal.querySelector('.crypto-modal-address').textContent=address;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
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
