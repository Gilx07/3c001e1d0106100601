(()=>{
  'use strict';

  const body=document.body;
  if(!body)return;

  const coarse=matchMedia('(pointer: coarse)').matches||matchMedia('(hover: none)').matches;
  const small=innerWidth<=900;
  const cores=Number(navigator.hardwareConcurrency)||8;
  const memory=Number(navigator.deviceMemory)||8;
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const saveData=Boolean(connection?.saveData);
  const tiers=['high','balanced','low'];

  let tier='high';
  if(saveData||memory<=4||cores<=4||(coarse&&small&&cores<=6)) tier='low';
  else if(coarse||small||memory<=8||cores<=8) tier='balanced';

  function applyTier(next){
    if(!tiers.includes(next)||next===tier&&body.classList.contains(`perf-${next}`))return;
    tiers.forEach(name=>body.classList.remove(`perf-${name}`));
    tier=next;
    body.classList.add(`perf-${tier}`);
    document.documentElement.dataset.performanceTier=tier;
  }

  applyTier(tier);
  if(coarse)body.classList.add('perf-touch');

  const syncVisibility=()=>body.classList.toggle('perf-paused',document.hidden);
  document.addEventListener('visibilitychange',syncVisibility,{passive:true});
  syncVisibility();

  if(coarse){
    body.style.setProperty('--sx','0px');
    body.style.setProperty('--sy','0px');
  }

  const observer=new MutationObserver(()=>{
    if(!body.classList.contains('ritual-active')){
      document.querySelectorAll('.fall-piece').forEach(el=>el.style.removeProperty('will-change'));
    }
  });
  observer.observe(body,{attributes:true,attributeFilter:['class']});

  // Short real-world FPS sample. It only downgrades quality and then stops,
  // so there is no permanent monitoring overhead.
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&tier!=='low'){
    let frames=0;
    let started=0;
    let raf=0;
    const sample=now=>{
      if(document.hidden||body.classList.contains('ritual-active')){
        started=0;frames=0;raf=requestAnimationFrame(sample);return;
      }
      if(!started)started=now;
      frames++;
      const elapsed=now-started;
      if(elapsed<3600){raf=requestAnimationFrame(sample);return;}
      const fps=frames*1000/elapsed;
      if(fps<34)applyTier('low');
      else if(fps<48&&tier==='high')applyTier('balanced');
      cancelAnimationFrame(raf);
    };
    raf=requestAnimationFrame(sample);
  }

  if(!document.querySelector('script[src="js/navigation.js"]')){
    const navigation=document.createElement('script');
    navigation.src='js/navigation.js';
    navigation.defer=true;
    document.body.appendChild(navigation);
  }
})();
