(()=>{
  'use strict';
  const body=document.body;
  const lockbox=document.getElementById('lockbox');
  const lockClose=document.getElementById('lock-close');
  if(!body||!lockbox)return;

  let running=false;
  let timers=[];
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);timers.push(id);return id;};
  const clearTimers=()=>{timers.forEach(clearTimeout);timers=[];};

  function start(){
    if(running)return;
    running=true;
    clearTimers();
    body.classList.add('ritual-shaking');

    // Show the focused lock opening first, then restore it to the room.
    later(()=>{
      if(body.classList.contains('lock-focused')) lockClose?.click();
    },560);

    // The orb flight is handled by main.js. Keep the compositor-only quake
    // alive until the orb reaches the window, then let main.js run ONE fall pass.
    later(()=>{
      body.classList.remove('ritual-shaking');
      body.classList.add('ritual-impact');
    },6880);
  }

  function stop(){
    if(!running)return;
    running=false;
    clearTimers();
    body.classList.remove('ritual-shaking','ritual-impact');
  }

  const observer=new MutationObserver(()=>{
    if(body.classList.contains('ritual-active')) start();
    else stop();
  });
  observer.observe(body,{attributes:true,attributeFilter:['class']});
  if(body.classList.contains('ritual-active'))start();
})();
