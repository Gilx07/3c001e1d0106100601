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

  let tier='high';
  if(saveData||memory<=4||cores<=4||(coarse&&small&&cores<=6)) tier='low';
  else if(coarse||small||memory<=8||cores<=8) tier='balanced';

  body.classList.add(`perf-${tier}`);
  if(coarse)body.classList.add('perf-touch');
  document.documentElement.dataset.performanceTier=tier;

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

  if(!document.querySelector('script[src="js/navigation.js"]')){
    const navigation=document.createElement('script');
    navigation.src='js/navigation.js';
    navigation.defer=true;
    document.body.appendChild(navigation);
  }
})();
