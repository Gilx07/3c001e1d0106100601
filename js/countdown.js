(()=>{
  'use strict';

  const targets=[...document.querySelectorAll('[data-release-countdown]')];
  if(!targets.length)return;

  const pad=value=>String(value).padStart(2,'0');

  const render=()=>{
    const now=Date.now();

    targets.forEach(root=>{
      const target=Date.parse(root.dataset.releaseCountdown||'');
      if(!Number.isFinite(target))return;

      const diff=Math.max(0,target-now);
      const released=diff<=0;

      const days=Math.floor(diff/86400000);
      const hours=Math.floor((diff%86400000)/3600000);
      const minutes=Math.floor((diff%3600000)/60000);
      const seconds=Math.floor((diff%60000)/1000);

      const value=root.querySelector('[data-countdown-value]');
      const status=root.querySelector('[data-countdown-status]');

      if(value)value.textContent=released?'RELEASED':`${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      if(status)status.textContent=released?'SOURCE CODE RELEASED':'SOURCE CODE RELEASE';

      root.classList.toggle('is-released',released);
    });
  };

  render();
  setInterval(render,1000);
})();
