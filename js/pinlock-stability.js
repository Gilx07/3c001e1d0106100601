(()=>{
  'use strict';

  const body=document.body;
  const viewport=document.querySelector('.viewport');
  const lockbox=document.getElementById('lockbox');
  const status=document.getElementById('pin-status');
  if(!body||!viewport||!lockbox)return;

  let modal=document.getElementById('pinlock-modal-layer');
  if(!modal){
    modal=document.createElement('div');
    modal.id='pinlock-modal-layer';
    modal.className='pinlock-modal-layer';
    modal.setAttribute('aria-hidden','true');
    viewport.appendChild(modal);
  }

  const anchor=document.createComment('pinlock-anchor');
  lockbox.parentNode.insertBefore(anchor,lockbox);
  let inModal=false;
  let returnFocus=null;

  const announce=message=>{if(status)status.textContent=message;};
  const focusables=()=>[...lockbox.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.getAttribute('aria-hidden')!=='true');

  function mount(){
    if(inModal)return;
    returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:lockbox;
    modal.appendChild(lockbox);
    modal.setAttribute('aria-hidden','false');
    lockbox.style.setProperty('--focus-x','0px');
    lockbox.style.setProperty('--focus-y','0px');
    lockbox.setAttribute('role','dialog');
    lockbox.setAttribute('aria-modal','true');
    lockbox.setAttribute('aria-label','PIN lock tiga digit');
    inModal=true;
    requestAnimationFrame(()=>{
      const first=focusables()[0]||lockbox;
      first.focus({preventScroll:true});
    });
    announce('PIN lock dibuka. Fokus berada di dalam dialog.');
  }

  function restore(){
    if(!inModal)return;
    if(anchor.parentNode)anchor.parentNode.insertBefore(lockbox,anchor.nextSibling);
    modal.setAttribute('aria-hidden','true');
    lockbox.style.setProperty('--focus-x','0px');
    lockbox.style.setProperty('--focus-y','0px');
    lockbox.setAttribute('role','button');
    lockbox.removeAttribute('aria-modal');
    lockbox.setAttribute('aria-label','Buka PIN lock tiga digit');
    inModal=false;
    const target=returnFocus&&document.contains(returnFocus)?returnFocus:lockbox;
    requestAnimationFrame(()=>target.focus?.({preventScroll:true}));
    announce('PIN lock ditutup.');
  }

  function sync(){
    if(body.classList.contains('lock-focused'))mount();
    else restore();
  }

  const observer=new MutationObserver(sync);
  observer.observe(body,{attributes:true,attributeFilter:['class']});

  modal.addEventListener('pointerdown',event=>{
    if(event.target!==modal)return;
    document.getElementById('lock-close')?.click();
  });

  document.addEventListener('keydown',event=>{
    if(!inModal)return;
    if(event.key==='Escape'){
      event.preventDefault();
      document.getElementById('lock-close')?.click();
      return;
    }
    if(event.key!=='Tab')return;
    const items=focusables();
    if(!items.length){event.preventDefault();lockbox.focus();return;}
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  addEventListener('resize',()=>{
    if(!inModal)return;
    lockbox.style.setProperty('--focus-x','0px');
    lockbox.style.setProperty('--focus-y','0px');
  },{passive:true});

  sync();
})();
