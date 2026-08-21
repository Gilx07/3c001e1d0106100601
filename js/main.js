(()=>{
  'use strict';
  const body=document.body;
  const number=document.getElementById('number');
  const progress=document.getElementById('progress');
  const phrase=document.getElementById('phrase');
  const theme=document.getElementById('theme');
  const themeColor=document.getElementById('theme-color');
  const cursorLight=document.getElementById('cursor-light');
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const phrases=['Lux in tenebris','Memento vivere','Tempus fugit','Astra inclinant','Per aspera ad astra','Sic transit gloria','Nox profunda','Umbra manet','Vox antiqua','Silentium aeternum','Lumen occultum','Ordo ab chao','Fatum vocat','Ignis fatuus','Somnia vana','Via incognita','Anima mundi','Ars longa','Vita brevis','Sub rosa','In absentia','Ad infinitum','Ex nihilo','De profundis','In nocte','Terra incognita','Pax obscura','Vox nihili','Aeternum vale','Mutatis mutandis','Gnothi seauton','Panta rhei','Kairos','Aletheia','Nyx','Ananke','Moira','Logos','Kosmos','Erebus','Chronos','Skotos','Phos','Psyche','Eidolon','Lethe','Aion','Nostos','Oneiros','Aporia'];
  let omen=false,savedLight=false,phraseIndex=Math.floor(Math.random()*phrases.length);
  let px=innerWidth/2,py=innerHeight/2,tx=px,ty=py,scrollTarget=scrollY,scrollNow=scrollTarget,raf=0;

  phrase.textContent=phrases[phraseIndex];

  function setTheme(light){
    body.classList.toggle('light',light);
    themeColor.content=light?'#b7a581':'#070605';
    theme.setAttribute('aria-pressed',String(light));
  }

  function resetProgress(){
    if(motionQuery.matches){progress.style.animation='none';return;}
    progress.style.animation='none';
    void progress.offsetWidth;
    progress.style.animation='shrink 1500ms linear forwards';
  }

  function finishOmen(){
    body.classList.remove('omen');
    setTheme(savedLight);
    theme.disabled=false;
    omen=false;
    resetProgress();
  }

  function trigger666(){
    if(omen)return;
    omen=true;
    savedLight=body.classList.contains('light');
    body.classList.remove('light');
    body.classList.add('omen');
    theme.disabled=true;
    themeColor.content='#130101';
    progress.style.animation='none';

    if(motionQuery.matches){
      setTimeout(finishOmen,1200);
      return;
    }

    const pieces=[...document.querySelectorAll('.fall-piece')];
    const animations=pieces.map((el,i)=>{
      const rect=el.getBoundingClientRect();
      const drop=Math.max(innerHeight+rect.height+180,850);
      const drift=(Math.random()*160)-80;
      const rot=(Math.random()*12)-6;
      return el.animate([
        {translate:'0 0',rotate:'0deg',opacity:1},
        {translate:`${drift*.18}px ${drop*.13}px`,rotate:`${rot*.15}deg`,opacity:1,offset:.22},
        {translate:`${drift*.58}px ${drop*.55}px`,rotate:`${rot*.58}deg`,opacity:.82,offset:.63},
        {translate:`${drift}px ${drop}px`,rotate:`${rot}deg`,opacity:.03,filter:'blur(2px)'}
      ],{duration:2300,delay:i*55+Math.random()*80,easing:'cubic-bezier(.2,.72,.16,1)',fill:'both'});
    });

    setTimeout(()=>{
      animations.forEach((animation,i)=>{animation.playbackRate=-(.72+i*.022);animation.play();});
      Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{
        animations.forEach(animation=>animation.cancel());
        finishOmen();
      });
    },6600);
  }

  function reveal(){
    if(omen||document.hidden)return;
    const value=Math.floor(Math.random()*999)+1;
    number.textContent=value;
    if(!motionQuery.matches){number.classList.remove('pop');void number.offsetWidth;number.classList.add('pop');}
    resetProgress();
    if(value===666)trigger666();
  }

  function changePhrase(){
    if(omen||document.hidden)return;
    if(motionQuery.matches){
      let n;do{n=Math.floor(Math.random()*phrases.length)}while(n===phraseIndex);
      phraseIndex=n;phrase.textContent=phrases[n];return;
    }
    phrase.classList.add('fade');
    setTimeout(()=>{
      if(omen||document.hidden)return;
      let n;do{n=Math.floor(Math.random()*phrases.length)}while(n===phraseIndex);
      phraseIndex=n;phrase.textContent=phrases[n];phrase.classList.remove('fade');
    },600);
  }

  theme.addEventListener('click',()=>{if(!omen)setTheme(!body.classList.contains('light'));});

  function frame(){
    raf=0;
    px+=(tx-px)*.13;py+=(ty-py)*.13;scrollNow+=(scrollTarget-scrollNow)*.12;
    body.style.setProperty('--sx',((px-innerWidth/2)/innerWidth*-8)+'px');
    body.style.setProperty('--sy',(-scrollNow*.055+(py-innerHeight/2)/innerHeight*-5)+'px');
    cursorLight.style.transform=`translate3d(${px}px,${py}px,0)`;
    if(Math.abs(tx-px)>.2||Math.abs(ty-py)>.2||Math.abs(scrollTarget-scrollNow)>.2)raf=requestAnimationFrame(frame);
  }
  function requestFrame(){if(!raf&&!motionQuery.matches)raf=requestAnimationFrame(frame);}
  function onPointerMove(e){tx=e.clientX;ty=e.clientY;requestFrame();}
  function onScroll(){scrollTarget=scrollY;requestFrame();}
  function syncMotionPreference(){
    if(motionQuery.matches){
      if(raf){cancelAnimationFrame(raf);raf=0;}
      body.style.setProperty('--sx','0px');body.style.setProperty('--sy','0px');
      cursorLight.style.transform='translate3d(50vw,50vh,0)';
    }else{
      tx=px=innerWidth/2;ty=py=innerHeight/2;scrollTarget=scrollNow=scrollY;requestFrame();
    }
  }

  addEventListener('pointermove',onPointerMove,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{if(!motionQuery.matches){tx=Math.min(tx,innerWidth);ty=Math.min(ty,innerHeight);requestFrame();}},{passive:true});
  motionQuery.addEventListener?.('change',syncMotionPreference);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!omen){reveal();changePhrase();}});

  setTheme(false);
  syncMotionPreference();
  reveal();
  setInterval(reveal,1500);
  setInterval(changePhrase,5000);
})();
