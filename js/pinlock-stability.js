(()=>{
  'use strict';

  const body=document.body;
  const viewport=document.querySelector('.viewport');
  const lockbox=document.getElementById('lockbox');
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

  function mount(){
    if(inModal)return;
    modal.appendChild(lockbox);
    modal.setAttribute('aria-hidden','false');
    lockbox.style.setProperty('--focus-x','0px');
    lockbox.style.setProperty('--focus-y','0px');
    inModal=true;
  }

  function restore(){
    if(!inModal)return;
    if(anchor.parentNode)anchor.parentNode.insertBefore(lockbox,anchor.nextSibling);
    modal.setAttribute('aria-hidden','true');
    lockbox.style.setProperty('--focus-x','0px');
    lockbox.style.setProperty('--focus-y','0px');
    inModal=false;
  }

  function sync(){
    if(body.classList.contains('lock-focused'))mount();
    else restore();
  }

  const observer=new MutationObserver(sync);
  observer.observe(body,{attributes:true,attributeFilter:['class']});

  modal.addEventListener('pointerdown',event=>{
    if(event.target!==modal)return;
    const close=document.getElementById('lock-close');
    close?.click();
  });

  addEventListener('resize',()=>{
    if(!inModal)return;
    lockbox.style.setProperty('--focus-x','0px');
    lockbox.style.setProperty('--focus-y','0px');
  },{passive:true});

  sync();
})();
