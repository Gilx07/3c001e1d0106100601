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
  const lockClose=document.getElementById('lock-close');
  const lockBackdrop=document.getElementById('lock-focus-backdrop');
  const archWindow=document.getElementById('arch-window');
  const redOrb=document.getElementById('red-orb');
  const deskLamp=document.getElementById('desk-lamp');
  const digitViewports=[...document.querySelectorAll('.digit-viewport')];
  const tracks=[document.getElementById('digit-hundreds'),document.getElementById('digit-tens'),document.getElementById('digit-ones')];
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const phrases=['Lux in tenebris','Memento vivere','Tempus fugit','Astra inclinant','Per aspera ad astra','Sic transit gloria','Nox profunda','Umbra manet','Vox antiqua','Silentium aeternum','Lumen occultum','Ordo ab chao','Fatum vocat','Ignis fatuus','Somnia vana','Via incognita','Anima mundi','Ars longa','Vita brevis','Sub rosa','In absentia','Ad infinitum','Ex nihilo','De profundis','In nocte','Terra incognita','Pax obscura','Vox nihili','Aeternum vale','Mutatis mutandis','Gnothi seauton','Panta rhei','Kairos','Aletheia','Nyx','Ananke','Moira','Logos','Kosmos','Erebus','Chronos','Skotos','Phos','Psyche','Eidolon','Lethe','Aion','Nostos','Oneiros','Aporia'];

  const DIGIT_HEIGHT=56,BASE_INDEX=30,reelState=[BASE_INDEX,BASE_INDEX,BASE_INDEX];
  let ritualActive=false,manualMode=false,lockFocused=false,lampOn=false;
  let phraseIndex=Math.floor(Math.random()*phrases.length),revealTimer=0,phraseTimer=0,resumeTimer=0;
  let px=innerWidth/2,py=innerHeight/2,tx=px,ty=py,raf=0;

  phrase.textContent=phrases[phraseIndex];
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

  function buildTracks(){
    tracks.forEach(track=>{
      const frag=document.createDocumentFragment();
      for(let r=0;r<7;r++)for(let d=0;d<10;d++){const el=document.createElement('span');el.className='digit';el.textContent=String(d);frag.appendChild(el);}
      track.replaceChildren(frag);
    });
    resetDigits('000');
  }

  function digitAt(index){return ((reelState[index]%10)+10)%10;}
  function currentCode(){return digitAt(0)*100+digitAt(1)*10+digitAt(2);}
  function syncDigitAria(){digitViewports.forEach((viewport,index)=>viewport.setAttribute('aria-valuenow',String(digitAt(index))));}

  function resetDigits(text){
    text.split('').forEach((char,index)=>{const digit=Number(char);reelState[index]=BASE_INDEX+digit;tracks[index].style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;tracks[index].style.filter='none';});
    syncDigitAria();
  }

  function setTheme(light){body.classList.toggle('light',light);themeColor.content=light?'#b7a581':'#070605';theme.setAttribute('aria-pressed',String(light));}
  function setLamp(on){lampOn=on;body.classList.toggle('lamp-on',on);deskLamp.setAttribute('aria-pressed',String(on));deskLamp.setAttribute('aria-label',on?'Matikan lampu meja':'Nyalakan lampu meja');}
  function toggleLamp(){if(!ritualActive)setLamp(!lampOn);}

  function resetProgress(){
    if(manualMode||ritualActive||motionQuery.matches){progress.style.animation='none';return;}
    progress.style.animation='none';void progress.offsetWidth;progress.style.animation='shrink 1500ms linear forwards';
  }

  function pulseArrow(direction){const target=direction>0?arrowUp:arrowDown;target.classList.remove('active');void target.offsetWidth;target.classList.add('active');}

  function scheduleAutoResume(delay=650){
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(()=>{if(!ritualActive&&!lockFocused){manualMode=false;lockbox.classList.remove('manual');resetProgress();}},delay);
  }

  function updateFocusOffset(){
    if(!lockFocused)return;
    lockbox.style.setProperty('--focus-x','0px');lockbox.style.setProperty('--focus-y','0px');
    const rect=lockbox.getBoundingClientRect();
    const dx=innerWidth*.5-(rect.left+rect.width/2),dy=innerHeight*.5-(rect.top+rect.height/2);
    lockbox.style.setProperty('--focus-x',`${dx}px`);lockbox.style.setProperty('--focus-y',`${dy}px`);
  }

  function openLockFocus(force=false){
    if((ritualActive&&!force)||lockFocused)return;
    lockFocused=true;manualMode=true;clearTimeout(resumeTimer);progress.style.animation='none';
    body.classList.add('lock-focused');lockbox.classList.add('focused','manual');lockbox.setAttribute('aria-expanded','true');lockbox.setAttribute('aria-label','PIN lock terbuka. Geser digit ke atas atau bawah.');
    digitViewports.forEach(v=>v.tabIndex=0);requestAnimationFrame(updateFocusOffset);
  }

  function closeLockFocus({resume=true}={}){
    if(!lockFocused)return;
    lockFocused=false;body.classList.remove('lock-focused');lockbox.classList.remove('focused');lockbox.setAttribute('aria-expanded','false');lockbox.setAttribute('aria-label','Buka PIN lock tiga digit');
    lockbox.style.setProperty('--focus-x','0px');lockbox.style.setProperty('--focus-y','0px');digitViewports.forEach(v=>v.tabIndex=-1);if(resume)scheduleAutoResume();
  }

  function settleDigit(index,targetDigit,direction=1,duration=250){
    const track=tracks[index],currentIndex=reelState[index],currentDigit=digitAt(index);
    const delta=direction>0?(targetDigit-currentDigit+10)%10:(currentDigit-targetDigit+10)%10;
    const targetIndex=direction>0?currentIndex+delta:currentIndex-delta,startY=-currentIndex*DIGIT_HEIGHT,endY=-targetIndex*DIGIT_HEIGHT;
    if(motionQuery.matches){reelState[index]=BASE_INDEX+targetDigit;track.style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;track.classList.remove('dragging');syncDigitAria();return Promise.resolve();}
    const animation=track.animate([{transform:`translateY(${startY}px)`},{transform:`translateY(${endY+(direction>0?-5:5)}px)`,offset:.82},{transform:`translateY(${endY}px)`}],{duration,easing:'cubic-bezier(.18,.82,.2,1)',fill:'forwards'});
    return animation.finished.catch(()=>null).then(()=>{reelState[index]=BASE_INDEX+targetDigit;track.style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;track.classList.remove('dragging');animation.cancel();syncDigitAria();});
  }

  function animateTrack(track,index,targetDigit,direction){
    const currentIndex=reelState[index],currentDigit=digitAt(index),loops=index===2?1:2;
    let targetIndex;
    if(direction>0){const offset=(targetDigit-currentDigit+10)%10;targetIndex=currentIndex+loops*10+offset;}else{const offset=(currentDigit-targetDigit+10)%10;targetIndex=currentIndex-loops*10-offset;}
    const startY=-currentIndex*DIGIT_HEIGHT,endY=-targetIndex*DIGIT_HEIGHT,overshoot=endY+(direction>0?-DIGIT_HEIGHT*.18:DIGIT_HEIGHT*.18),duration=650+index*110+Math.random()*160;
    if(motionQuery.matches){reelState[index]=BASE_INDEX+targetDigit;track.style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;syncDigitAria();return Promise.resolve();}
    const animation=track.animate([{transform:`translateY(${startY}px)`,filter:'blur(0px)'},{transform:`translateY(${(startY+endY)*.5}px)`,filter:'blur(1.6px)',offset:.56},{transform:`translateY(${overshoot}px)`,filter:'blur(.25px)',offset:.9},{transform:`translateY(${endY}px)`,filter:'blur(0px)'}],{duration,easing:'cubic-bezier(.12,.88,.2,1)',fill:'forwards'});
    return animation.finished.catch(()=>null).then(()=>{reelState[index]=BASE_INDEX+targetDigit;track.style.transform=`translateY(${-reelState[index]*DIGIT_HEIGHT}px)`;track.style.filter='none';animation.cancel();syncDigitAria();});
  }

  function spinDisplay(value){const digits=String(value).padStart(3,'0').split('').map(Number),direction=Math.random()<.5?1:-1;pulseArrow(direction);return Promise.all(tracks.map((track,index)=>animateTrack(track,index,digits[index],direction)));}

  async function roamOrb(){
    const roomRect=room.getBoundingClientRect(),lockRect=lockbox.getBoundingClientRect(),windowRect=archWindow.getBoundingClientRect();
    const startX=lockRect.left+lockRect.width*.55-roomRect.left,startY=lockRect.top+lockRect.height*.3-roomRect.top,exitX=windowRect.left+windowRect.width*.5-roomRect.left,exitY=windowRect.top+windowRect.height*.38-roomRect.top;
    if(motionQuery.matches){redOrb.style.opacity='1';redOrb.style.transform=`translate3d(${exitX}px,${exitY}px,0) scale(.3)`;await wait(500);redOrb.style.opacity='0';return;}
    const frames=[{transform:`translate3d(${startX}px,${startY}px,0) scale(.4)`,opacity:0,offset:0}];let lastX=startX,lastY=startY;
    for(let i=1;i<=10;i++){const x=roomRect.width*(.16+Math.random()*.68),y=roomRect.height*(.14+Math.random()*.62);lastX=x;lastY=y;frames.push({transform:`translate3d(${x}px,${y}px,0) scale(${.8+Math.random()*.45})`,opacity:1,filter:`blur(${Math.random()*.7}px)`,offset:i/10});}
    const roam=redOrb.animate(frames,{duration:5000,easing:'cubic-bezier(.35,.65,.3,1)',fill:'both'});await roam.finished.catch(()=>null);roam.cancel();
    const exit=redOrb.animate([{transform:`translate3d(${lastX}px,${lastY}px,0) scale(1)`,opacity:1},{transform:`translate3d(${exitX}px,${exitY}px,0) scale(.9)`,opacity:1,offset:.72},{transform:`translate3d(${exitX+windowRect.width*.12}px,${exitY-windowRect.height*.08}px,0) scale(.1)`,opacity:0}],{duration:1150,easing:'cubic-bezier(.25,.7,.28,1)',fill:'both'});
    await exit.finished.catch(()=>null);exit.cancel();redOrb.style.opacity='0';
  }

  async function roomFallSequence(){
    if(motionQuery.matches)return;
    const margin=18,pieces=[...document.querySelectorAll('.fall-piece')],animations=[];
    for(const el of pieces){
      const rect=el.getBoundingClientRect();if(rect.width<=0||rect.height<=0)continue;
      const maxDown=Math.max(0,innerHeight-margin-rect.bottom),drop=Math.min(maxDown,Math.max(18,innerHeight*(.10+Math.random()*.12)));
      let drift=0;if(rect.width<innerWidth-margin*2){const minDrift=margin-rect.left,maxDrift=innerWidth-margin-rect.right;drift=clamp(Math.random()*100-50,minDrift,maxDrift);}
      const rot=Math.random()*7-3.5;
      animations.push(el.animate([{translate:'0 0',rotate:'0deg',opacity:1},{translate:`${drift*.35}px ${drop*.45}px`,rotate:`${rot*.35}deg`,opacity:1,offset:.55},{translate:`${drift}px ${drop}px`,rotate:`${rot}deg`,opacity:.94}],{duration:900+Math.random()*350,easing:'cubic-bezier(.25,.72,.22,1)',fill:'both'}));
    }
    await Promise.allSettled(animations.map(a=>a.finished));await wait(1200);animations.forEach((a,i)=>{a.playbackRate=-(.9+i*.008);a.play();});await Promise.allSettled(animations.map(a=>a.finished));animations.forEach(a=>a.cancel());
  }

  async function trigger666(){
    if(ritualActive)return;
    ritualActive=true;clearTimeout(resumeTimer);manualMode=true;theme.disabled=true;progress.style.animation='none';body.classList.add('ritual-active');lockbox.classList.add('opening');if(!lockFocused)openLockFocus(true);
    await wait(motionQuery.matches?100:700);await roamOrb();closeLockFocus({resume:false});await roomFallSequence();
    lockbox.classList.remove('opening','manual');body.classList.remove('ritual-active');theme.disabled=false;ritualActive=false;manualMode=false;resetProgress();
  }

  async function checkCode(){if(currentCode()===666&&!ritualActive)await trigger666();}
  async function reveal(){if(ritualActive||manualMode||lockFocused||document.hidden)return;const value=Math.floor(Math.random()*999)+1;await spinDisplay(value);resetProgress();if(value===666)await trigger666();}

  function changePhrase(){
    if(ritualActive||document.hidden)return;
    if(motionQuery.matches){let n;do{n=Math.floor(Math.random()*phrases.length);}while(n===phraseIndex);phraseIndex=n;phrase.textContent=phrases[n];return;}
    phrase.classList.add('fade');setTimeout(()=>{if(ritualActive||document.hidden)return;let n;do{n=Math.floor(Math.random()*phrases.length);}while(n===phraseIndex);phraseIndex=n;phrase.textContent=phrases[n];phrase.classList.remove('fade');},600);
  }

  digitViewports.forEach((viewport,index)=>{
    let pointerId=null,startY=0,startDigit=0,moved=false;
    viewport.addEventListener('pointerdown',event=>{if(ritualActive)return;if(!lockFocused)openLockFocus(true);manualMode=true;pointerId=event.pointerId;startY=event.clientY;startDigit=digitAt(index);moved=false;viewport.setPointerCapture?.(pointerId);tracks[index].classList.add('dragging');event.stopPropagation();event.preventDefault();});
    viewport.addEventListener('pointermove',event=>{if(pointerId!==event.pointerId||ritualActive)return;const dy=event.clientY-startY;if(Math.abs(dy)>3)moved=true;const preview=BASE_INDEX+startDigit-dy/DIGIT_HEIGHT;tracks[index].style.transform=`translateY(${-preview*DIGIT_HEIGHT}px)`;event.preventDefault();});
    const endDrag=async event=>{if(pointerId!==event.pointerId)return;const dy=event.clientY-startY,steps=Math.round(-dy/(DIGIT_HEIGHT*.42)),targetDigit=(startDigit+steps+100)%10,direction=steps===0?(dy<=0?1:-1):(steps>0?1:-1);pointerId=null;viewport.releasePointerCapture?.(event.pointerId);pulseArrow(direction);await settleDigit(index,targetDigit,direction,moved?240:180);await checkCode();};
    viewport.addEventListener('pointerup',endDrag);
    viewport.addEventListener('pointercancel',event=>{if(pointerId!==event.pointerId)return;pointerId=null;tracks[index].classList.remove('dragging');resetDigits(String(currentCode()).padStart(3,'0'));});
    viewport.addEventListener('wheel',async event=>{if(ritualActive)return;event.preventDefault();event.stopPropagation();if(!lockFocused)openLockFocus(true);manualMode=true;const direction=event.deltaY<0?1:-1,target=(digitAt(index)+(direction>0?1:9))%10;pulseArrow(direction);await settleDigit(index,target,direction,170);await checkCode();},{passive:false});
    viewport.addEventListener('keydown',async event=>{if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;event.preventDefault();const direction=event.key==='ArrowUp'?1:-1,target=(digitAt(index)+(direction>0?1:9))%10;pulseArrow(direction);await settleDigit(index,target,direction,170);await checkCode();});
  });

  lockbox.addEventListener('click',event=>{if(ritualActive||event.target.closest('.lock-close,.digit-viewport'))return;if(!lockFocused)openLockFocus();});
  lockbox.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&!lockFocused){event.preventDefault();openLockFocus();}});
  lockClose.addEventListener('click',event=>{event.stopPropagation();closeLockFocus();});lockBackdrop.addEventListener('click',()=>closeLockFocus());
  deskLamp.addEventListener('click',toggleLamp);deskLamp.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleLamp();}});
  theme.addEventListener('click',()=>{if(!ritualActive)setTheme(!body.classList.contains('light'));});

  function frame(){raf=0;px+=(tx-px)*.13;py+=(ty-py)*.13;body.style.setProperty('--sx',((px-innerWidth/2)/innerWidth*-8)+'px');body.style.setProperty('--sy',((py-innerHeight/2)/innerHeight*-5)+'px');cursorLight.style.transform=`translate3d(${px}px,${py}px,0)`;if(Math.abs(tx-px)>.2||Math.abs(ty-py)>.2)raf=requestAnimationFrame(frame);}
  function requestFrame(){if(!raf&&!motionQuery.matches&&!lockFocused)raf=requestAnimationFrame(frame);}
  function onPointerMove(event){tx=event.clientX;ty=event.clientY;requestFrame();}
  function syncMotionPreference(){if(motionQuery.matches){if(raf){cancelAnimationFrame(raf);raf=0;}body.style.setProperty('--sx','0px');body.style.setProperty('--sy','0px');cursorLight.style.transform='translate3d(50vw,50vh,0)';}else{tx=px=innerWidth/2;ty=py=innerHeight/2;requestFrame();}}
  function startIntervals(){clearInterval(revealTimer);clearInterval(phraseTimer);revealTimer=setInterval(reveal,1500);phraseTimer=setInterval(changePhrase,5000);}

  addEventListener('pointermove',onPointerMove,{passive:true});
  addEventListener('resize',()=>{tx=px=innerWidth/2;ty=py=innerHeight/2;updateFocusOffset();requestFrame();},{passive:true});
  addEventListener('keydown',event=>{if(event.key==='Escape'&&lockFocused&&!ritualActive)closeLockFocus();});
  motionQuery.addEventListener?.('change',()=>{syncMotionPreference();resetProgress();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!ritualActive&&!manualMode){reveal();changePhrase();}});

  buildTracks();setTheme(false);setLamp(false);syncMotionPreference();reveal();startIntervals();
})();
