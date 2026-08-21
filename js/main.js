(()=>{
  'use strict';
  const body=document.body;
  const progress=document.getElementById('progress');
  const phrase=document.getElementById('phrase');
  const theme=document.getElementById('theme');
  const themeColor=document.getElementById('theme-color');
  const cursorLight=document.getElementById('cursor-light');
  const arrowUp=document.getElementById('arrow-up');
  const arrowDown=document.getElementById('arrow-down');
  const tracks=[
    document.getElementById('digit-hundreds'),
    document.getElementById('digit-tens'),
    document.getElementById('digit-ones')
  ];
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const phrases=['Lux in tenebris','Memento vivere','Tempus fugit','Astra inclinant','Per aspera ad astra','Sic transit gloria','Nox profunda','Umbra manet','Vox antiqua','Silentium aeternum','Lumen occultum','Ordo ab chao','Fatum vocat','Ignis fatuus','Somnia vana','Via incognita','Anima mundi','Ars longa','Vita brevis','Sub rosa','In absentia','Ad infinitum','Ex nihilo','De profundis','In nocte','Terra incognita','Pax obscura','Vox nihili','Aeternum vale','Mutatis mutandis','Gnothi seauton','Panta rhei','Kairos','Aletheia','Nyx','Ananke','Moira','Logos','Kosmos','Erebus','Chronos','Skotos','Phos','Psyche','Eidolon','Lethe','Aion','Nostos','Oneiros','Aporia'];
  const DIGIT_HEIGHT=56;
  const BASE_INDEX=30;
  const reelState=[BASE_INDEX,BASE_INDEX,BASE_INDEX];
  let omen=false,savedLight=false,phraseIndex=Math.floor(Math.random()*phrases.length),revealTimer=0,phraseTimer=0;
  let px=innerWidth/2,py=innerHeight/2,tx=px,ty=py,scrollTarget=scrollY,scrollNow=scrollTarget,raf=0;

  phrase.textContent=phrases[phraseIndex];

  function buildTracks(){
    tracks.forEach((track)=>{
      const frag=document.createDocumentFragment();
      for(let r=0;r<7;r++){
        for(let d=0;d<10;d++){
          const el=document.createElement('span');
          el.className='digit';
          el.textContent=String(d);
          frag.appendChild(el);
        }
      }
      track.replaceChildren(frag);
    });
    resetDigits('000');
  }

  function resetDigits(text){
    text.split('').forEach((char,index)=>{
      const digit=Number(char);
      reelState[index]=BASE_INDEX+digit;
      tracks[index].style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;
      tracks[index].style.filter='none';
    });
  }

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
      const drift=(Math.random()*180)-90;
      const rot=(Math.random()*14)-7;
      return el.animate([
        {translate:'0 0',rotate:'0deg',opacity:1},
        {translate:`${drift*.18}px ${drop*.14}px`,rotate:`${rot*.18}deg`,opacity:1,offset:.22},
        {translate:`${drift*.62}px ${drop*.56}px`,rotate:`${rot*.62}deg`,opacity:.82,offset:.63},
        {translate:`${drift}px ${drop}px`,rotate:`${rot}deg`,opacity:.03,filter:'blur(2px)'}
      ],{duration:2300,delay:i*50+Math.random()*80,easing:'cubic-bezier(.2,.72,.16,1)',fill:'both'});
    });

    setTimeout(()=>{
      animations.forEach((animation,i)=>{animation.playbackRate=-(.72+i*.02);animation.play();});
      Promise.allSettled(animations.map((animation)=>animation.finished)).then(()=>{
        animations.forEach((animation)=>animation.cancel());
        finishOmen();
      });
    },6600);
  }

  function pulseArrow(direction){
    const target=direction>0?arrowUp:arrowDown;
    target.classList.remove('active');
    void target.offsetWidth;
    target.classList.add('active');
  }

  function animateTrack(track,index,targetDigit,direction){
    const currentIndex=reelState[index];
    const currentDigit=((currentIndex%10)+10)%10;
    const loops=index===2?1:2;
    let targetIndex;
    if(direction>0){
      const offset=(targetDigit-currentDigit+10)%10;
      targetIndex=currentIndex+(loops*10)+offset;
    }else{
      const offset=(currentDigit-targetDigit+10)%10;
      targetIndex=currentIndex-(loops*10)-offset;
    }
    const startY=-currentIndex*DIGIT_HEIGHT;
    const endY=-targetIndex*DIGIT_HEIGHT;
    const overshoot=endY+(direction>0?-DIGIT_HEIGHT*.18:DIGIT_HEIGHT*.18);
    const duration=650+index*110+Math.random()*160;
    const animation=track.animate([
      {transform:`translateY(${startY}px)`,filter:'blur(0px)'},
      {transform:`translateY(${(startY+endY)*.5}px)`,filter:'blur(1.6px)',offset:.56},
      {transform:`translateY(${overshoot}px)`,filter:'blur(.25px)',offset:.90},
      {transform:`translateY(${endY}px)`,filter:'blur(0px)'}
    ],{duration,easing:'cubic-bezier(.12,.88,.2,1)',fill:'forwards'});
    return animation.finished.catch(()=>null).then(()=>{
      reelState[index]=BASE_INDEX+targetDigit;
      track.style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;
      track.style.filter='none';
      animation.cancel();
    });
  }

  function spinDisplay(value){
    const text=String(value).padStart(3,'0');
    const digits=text.split('').map(Number);
    if(motionQuery.matches){
      resetDigits(text);
      return;
    }
    const direction=Math.random()<.5?1:-1;
    pulseArrow(direction);
    Promise.all(tracks.map((track,index)=>animateTrack(track,index,digits[index],direction)));
  }

  function reveal(){
    if(omen||document.hidden)return;
    const value=Math.floor(Math.random()*999)+1;
    spinDisplay(value);
    resetProgress();
    if(value===666)trigger666();
  }

  function changePhrase(){
    if(omen||document.hidden)return;
    if(motionQuery.matches){
      let n;do{n=Math.floor(Math.random()*phrases.length);}while(n===phraseIndex);
      phraseIndex=n;phrase.textContent=phrases[n];
      return;
    }
    phrase.classList.add('fade');
    setTimeout(()=>{
      if(omen||document.hidden)return;
      let n;do{n=Math.floor(Math.random()*phrases.length);}while(n===phraseIndex);
      phraseIndex=n;phrase.textContent=phrases[n];phrase.classList.remove('fade');
    },600);
  }

  theme.addEventListener('click',()=>{if(!omen)setTheme(!body.classList.contains('light'));});

  function frame(){
    raf=0;
    px+=(tx-px)*.13;
    py+=(ty-py)*.13;
    scrollNow+=(scrollTarget-scrollNow)*.11;
    body.style.setProperty('--sx',((px-innerWidth/2)/innerWidth*-12)+'px');
    body.style.setProperty('--sy',(-scrollNow*.072+(py-innerHeight/2)/innerHeight*-7)+'px');
    cursorLight.style.transform=`translate3d(${px}px,${py}px,0)`;
    if(Math.abs(tx-px)>.2||Math.abs(ty-py)>.2||Math.abs(scrollTarget-scrollNow)>.2)raf=requestAnimationFrame(frame);
  }
  function requestFrame(){if(!raf&&!motionQuery.matches)raf=requestAnimationFrame(frame);}
  function onPointerMove(e){tx=e.clientX;ty=e.clientY;requestFrame();}
  function onScroll(){scrollTarget=scrollY;requestFrame();}
  function syncMotionPreference(){
    if(motionQuery.matches){
      if(raf){cancelAnimationFrame(raf);raf=0;}
      body.style.setProperty('--sx','0px');
      body.style.setProperty('--sy','0px');
      cursorLight.style.transform='translate3d(50vw,50vh,0)';
    }else{
      tx=px=innerWidth/2;
      ty=py=innerHeight/2;
      scrollTarget=scrollNow=scrollY;
      requestFrame();
    }
  }

  function startIntervals(){
    clearInterval(revealTimer);
    clearInterval(phraseTimer);
    revealTimer=setInterval(reveal,1500);
    phraseTimer=setInterval(changePhrase,5000);
  }

  addEventListener('pointermove',onPointerMove,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{if(!motionQuery.matches){tx=Math.min(tx,innerWidth);ty=Math.min(ty,innerHeight);requestFrame();}},{passive:true});
  motionQuery.addEventListener?.('change',()=>{syncMotionPreference();resetProgress();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!omen){reveal();changePhrase();}});

  buildTracks();
  setTheme(false);
  syncMotionPreference();
  reveal();
  startIntervals();
})();
