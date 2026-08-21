(()=>{
  'use strict';

  const body=document.body;
  const room=document.getElementById('room');
  const progress=document.getElementById('progress');
  const phrase=document.getElementById('phrase');
  const theme=document.getElementById('theme');
  const themeColor=document.getElementById('theme-color');
  const cursorLight=document.getElementById('cursor-light');
  const arrowUp=document.getElementById('arrow-up');
  const arrowDown=document.getElementById('arrow-down');
  const lockbox=document.getElementById('lockbox');
  const lockWindow=document.getElementById('lock-window');
  const archWindow=document.getElementById('arch-window');
  const redOrb=document.getElementById('red-orb');
  const lampSwitch=document.getElementById('lamp-switch');
  const digitViewports=[...document.querySelectorAll('.digit-viewport')];
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
  let omen=false;
  let manualMode=false;
  let lampOn=false;
  let savedLight=false;
  let phraseIndex=Math.floor(Math.random()*phrases.length);
  let revealTimer=0;
  let phraseTimer=0;
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

  function digitAt(index){
    return ((reelState[index]%10)+10)%10;
  }

  function currentCode(){
    return digitAt(0)*100+digitAt(1)*10+digitAt(2);
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

  function setLamp(on){
    lampOn=on;
    body.classList.toggle('lamp-on',on);
    lampSwitch.setAttribute('aria-pressed',String(on));
    lampSwitch.setAttribute('aria-label',on?'Matikan lampu meja':'Nyalakan lampu meja');
  }

  function enterManualMode(){
    if(omen)return;
    manualMode=true;
    lockbox.classList.add('manual');
    progress.style.animation='none';
  }

  function resetProgress(){
    if(manualMode||motionQuery.matches){progress.style.animation='none';return;}
    progress.style.animation='none';
    void progress.offsetWidth;
    progress.style.animation='shrink 1500ms linear forwards';
  }

  function pulseArrow(direction){
    const target=direction>0?arrowUp:arrowDown;
    target.classList.remove('active');
    void target.offsetWidth;
    target.classList.add('active');
  }

  function settleDigit(index,targetDigit,direction=1,duration=260){
    const track=tracks[index];
    const currentIndex=reelState[index];
    const currentDigit=digitAt(index);
    const delta=direction>0?(targetDigit-currentDigit+10)%10:(currentDigit-targetDigit+10)%10;
    const targetIndex=direction>0?currentIndex+delta:currentIndex-delta;
    const startY=-currentIndex*DIGIT_HEIGHT;
    const endY=-targetIndex*DIGIT_HEIGHT;
    const animation=track.animate([
      {transform:`translateY(${startY}px)`},
      {transform:`translateY(${endY+(direction>0?-5:5)}px)`,offset:.82},
      {transform:`translateY(${endY}px)`}
    ],{duration,easing:'cubic-bezier(.18,.82,.2,1)',fill:'forwards'});
    return animation.finished.catch(()=>null).then(()=>{
      reelState[index]=BASE_INDEX+targetDigit;
      track.style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;
      track.classList.remove('dragging');
      animation.cancel();
    });
  }

  function animateTrack(track,index,targetDigit,direction){
    const currentIndex=reelState[index];
    const currentDigit=digitAt(index);
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
    if(motionQuery.matches){resetDigits(text);return Promise.resolve();}
    const direction=Math.random()<.5?1:-1;
    pulseArrow(direction);
    return Promise.all(tracks.map((track,index)=>animateTrack(track,index,digits[index],direction)));
  }

  async function roamOrb(){
    const roomRect=room.getBoundingClientRect();
    const lockRect=lockbox.getBoundingClientRect();
    const windowRect=archWindow.getBoundingClientRect();
    const startX=lockRect.left+lockRect.width*.62-roomRect.left;
    const startY=lockRect.top+lockRect.height*.28-roomRect.top;
    const exitX=windowRect.left+windowRect.width*.52-roomRect.left;
    const exitY=windowRect.top+windowRect.height*.38-roomRect.top;

    if(motionQuery.matches){
      redOrb.style.opacity='1';
      redOrb.style.transform=`translate3d(${exitX}px,${exitY}px,0) scale(.25)`;
      await new Promise(resolve=>setTimeout(resolve,700));
      redOrb.style.opacity='0';
      return;
    }

    const frames=[{transform:`translate3d(${startX}px,${startY}px,0) scale(.35)`,opacity:0,filter:'blur(1px)',offset:0}];
    const roamingPoints=9;
    for(let i=1;i<=roamingPoints;i++){
      const x=roomRect.width*(.16+Math.random()*.68);
      const y=roomRect.height*(.14+Math.random()*.60);
      frames.push({
        transform:`translate3d(${x}px,${y}px,0) scale(${.82+Math.random()*.55})`,
        opacity:1,
        filter:`blur(${Math.random()*.8}px)`,
        offset:(i/roamingPoints)*.82
      });
    }
    frames.push({transform:`translate3d(${exitX}px,${exitY}px,0) scale(.95)`,opacity:1,filter:'blur(.2px)',offset:.92});
    frames.push({transform:`translate3d(${exitX+windowRect.width*.12}px,${exitY-windowRect.height*.08}px,0) scale(.12)`,opacity:0,filter:'blur(3px)',offset:1});

    const animation=redOrb.animate(frames,{duration:6100,easing:'cubic-bezier(.28,.65,.32,1)',fill:'both'});
    await animation.finished.catch(()=>null);
    animation.cancel();
    redOrb.style.opacity='0';
  }

  async function roomFallSequence(){
    if(motionQuery.matches)return;
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
    await new Promise(resolve=>setTimeout(resolve,3000));
    animations.forEach((animation,i)=>{animation.playbackRate=-(.72+i*.02);animation.play();});
    await Promise.allSettled(animations.map(animation=>animation.finished));
    animations.forEach(animation=>animation.cancel());
  }

  async function trigger666(){
    if(omen)return;
    omen=true;
    savedLight=body.classList.contains('light');
    body.classList.remove('light');
    body.classList.add('omen');
    theme.disabled=true;
    progress.style.animation='none';
    themeColor.content='#130101';
    lockbox.classList.add('opening');

    await new Promise(resolve=>setTimeout(resolve,motionQuery.matches?120:850));
    await roamOrb();
    await roomFallSequence();

    lockbox.classList.remove('opening');
    body.classList.remove('omen');
    setTheme(savedLight);
    theme.disabled=false;
    omen=false;
    resetProgress();
  }

  async function checkCode(){
    if(currentCode()===666&&!omen)await trigger666();
  }

  async function reveal(){
    if(omen||manualMode||document.hidden)return;
    const value=Math.floor(Math.random()*999)+1;
    await spinDisplay(value);
    resetProgress();
    if(value===666)await trigger666();
  }

  function changePhrase(){
    if(omen||document.hidden)return;
    if(motionQuery.matches){
      let n;do{n=Math.floor(Math.random()*phrases.length);}while(n===phraseIndex);
      phraseIndex=n;phrase.textContent=phrases[n];return;
    }
    phrase.classList.add('fade');
    setTimeout(()=>{
      if(omen||document.hidden)return;
      let n;do{n=Math.floor(Math.random()*phrases.length);}while(n===phraseIndex);
      phraseIndex=n;phrase.textContent=phrases[n];phrase.classList.remove('fade');
    },600);
  }

  digitViewports.forEach((viewport,index)=>{
    let pointerId=null;
    let startY=0;
    let startDigit=0;
    let moved=false;

    viewport.addEventListener('pointerdown',(event)=>{
      if(omen)return;
      enterManualMode();
      pointerId=event.pointerId;
      startY=event.clientY;
      startDigit=digitAt(index);
      moved=false;
      viewport.setPointerCapture?.(pointerId);
      tracks[index].classList.add('dragging');
      event.preventDefault();
    });

    viewport.addEventListener('pointermove',(event)=>{
      if(pointerId!==event.pointerId||omen)return;
      const dy=event.clientY-startY;
      if(Math.abs(dy)>3)moved=true;
      const rawIndex=BASE_INDEX+startDigit-(dy/DIGIT_HEIGHT);
      tracks[index].style.transform=`translateY(${-rawIndex*DIGIT_HEIGHT}px)`;
      event.preventDefault();
    });

    const endDrag=async(event)=>{
      if(pointerId!==event.pointerId)return;
      const dy=event.clientY-startY;
      const steps=Math.round(-dy/(DIGIT_HEIGHT*.42));
      const targetDigit=(startDigit+steps+100)%10;
      const direction=steps===0?(dy<=0?1:-1):(steps>0?1:-1);
      pointerId=null;
      viewport.releasePointerCapture?.(event.pointerId);
      pulseArrow(direction);
      await settleDigit(index,targetDigit,direction,moved?240:180);
      await checkCode();
    };

    viewport.addEventListener('pointerup',endDrag);
    viewport.addEventListener('pointercancel',(event)=>{if(pointerId===event.pointerId){pointerId=null;tracks[index].classList.remove('dragging');resetDigits(String(currentCode()).padStart(3,'0'));}});
  });

  lampSwitch.addEventListener('click',()=>setLamp(!lampOn));
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
  function onPointerMove(event){tx=event.clientX;ty=event.clientY;requestFrame();}
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
  setLamp(false);
  syncMotionPreference();
  reveal();
  startIntervals();
})();
