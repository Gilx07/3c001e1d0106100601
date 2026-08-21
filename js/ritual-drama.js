(()=>{
  'use strict';
  const body=document.body;
  const lockbox=document.getElementById('lockbox');
  const lockClose=document.getElementById('lock-close');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!body||!lockbox)return;

  let running=false;
  let timers=[];
  let impactAnimations=[];
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);timers.push(id);return id;};
  const clearAll=()=>{timers.forEach(clearTimeout);timers=[];impactAnimations.forEach(a=>{try{a.cancel();}catch{}});impactAnimations=[];body.classList.remove('ritual-shaking','ritual-impact');};

  function dramaticFall(){
    if(motion.matches)return;
    body.classList.add('ritual-impact');
    const margin=22;
    impactAnimations=[...document.querySelectorAll('.fall-piece')].map((el,i)=>{
      const r=el.getBoundingClientRect();
      if(!r.width||!r.height)return null;
      const maxDown=Math.max(0,innerHeight-margin-r.bottom);
      const down=Math.min(maxDown,Math.max(28,innerHeight*(.14+Math.random()*.12)));
      const minDx=margin-r.left;
      const maxDx=innerWidth-margin-r.right;
      const drift=Math.max(minDx,Math.min(maxDx,(Math.random()*150)-75));
      const rot=(Math.random()*18)-9;
      return el.animate([
        {translate:'0 0',rotate:'0deg',offset:0},
        {translate:`${drift*.12}px ${Math.min(16,down*.15)}px`,rotate:`${rot*.12}deg`,offset:.16},
        {translate:`${drift*.42}px ${down*.52}px`,rotate:`${rot*.52}deg`,offset:.56},
        {translate:`${drift}px ${down}px`,rotate:`${rot}deg`,offset:1}
      ],{duration:1350+i*12,easing:'cubic-bezier(.12,.78,.16,1)',fill:'both'});
    }).filter(Boolean);
    later(()=>{
      impactAnimations.forEach((a,i)=>{a.playbackRate=-(.72+i*.006);a.play();});
      later(()=>{impactAnimations.forEach(a=>{try{a.cancel();}catch{}});impactAnimations=[];body.classList.remove('ritual-impact');},1550);
    },1550);
  }

  function start(){
    if(running)return;
    running=true;
    body.classList.add('ritual-shaking');

    // Let the lid visibly open in the focused modal, then return the lock to the room.
    later(()=>{
      if(body.classList.contains('lock-focused')) lockClose?.click();
    },560);

    // Existing orb begins after ~700 ms and exits after ~6.15 s.
    // Keep the quake alive through that flight, then stop exactly before the fall phase.
    later(()=>body.classList.remove('ritual-shaking'),6900);

    // Strengthen the existing fall phase without letting pieces leave the viewport.
    later(dramaticFall,6920);
  }

  function stop(){
    if(!running)return;
    running=false;
    clearAll();
  }

  const observer=new MutationObserver(()=>{
    const active=body.classList.contains('ritual-active');
    if(active)start(); else stop();
  });
  observer.observe(body,{attributes:true,attributeFilter:['class']});
  if(body.classList.contains('ritual-active'))start();
})();
