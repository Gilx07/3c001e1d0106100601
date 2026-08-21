(()=>{
  'use strict';

  const book=document.getElementById('ancient-book');
  const leftPage=document.getElementById('book-left-page');
  const rightPage=document.getElementById('book-right-page');
  const leftText=document.getElementById('book-left-text');
  const rightText=document.getElementById('book-right-text');
  const leftFolio=document.getElementById('book-left-folio');
  const rightFolio=document.getElementById('book-right-folio');
  const turningPage=document.getElementById('book-turning-page');
  const turningText=document.getElementById('book-turning-text');
  const prev=document.getElementById('book-prev');
  const next=document.getElementById('book-next');
  if(!book||!leftPage||!rightPage||!turningPage)return;

  const leaves=[
    ['ORBIS TACET\nsub luna rubra\nmemoria lapidis\nvigilia sine fine','NOX VETERIS\nferrum dormit\nlumen occultum\nporta manet'],
    ['UMBRA NOMEN\nvox inter muros\ncinis in manu\nnulla via recta','TEMPUS FRACTUM\nhora sine sono\nsanguis lunae\nscriptum manet'],
    ['SIGILLUM IX\ncorvus ad fenestram\nignis sub vitro\nscala ad nihilum','MATER NOCTIS\nsomnium ferri\nseptem claves\nuna porta'],
    ['DE PROFUNDIS\nlapis audit\nventus memorat\nvestigia redeunt','ARCANUM VETUS\numbrae numerant\ncaelum clausum\nvox non moritur'],
    ['ANIMA MUNDI\nsub rosa tace\nterra vigilat\ncinis respirat','LUMEN RUBRUM\nporta tremit\nordo dissolvitur\niter incipit'],
    ['LIBER OBSCURUS\nnomina deleta\nmanus ignota\nsignum tertium','FINIS NON FINIS\nrota vertitur\nmemoria redit\nnox custodit']
  ];

  let index=Math.floor(Math.random()*leaves.length);
  let flipping=false;
  let pointerId=null;
  let startX=0;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function render(){
    const pair=leaves[index];
    leftText.textContent=pair[0];
    rightText.textContent=pair[1];
    leftFolio.textContent=`FOL. ${index*2+1}`;
    rightFolio.textContent=`FOL. ${index*2+2}`;
  }

  async function flip(direction){
    if(flipping||document.body.classList.contains('ritual-active'))return;
    flipping=true;
    book.classList.add('is-flipping');
    turningPage.className='turning-page';
    turningText.textContent=direction>0?rightText.textContent:leftText.textContent;
    void turningPage.offsetWidth;
    turningPage.classList.add(direction>0?'next':'prev');
    await wait(660);
    index=(index+(direction>0?1:-1)+leaves.length)%leaves.length;
    render();
    turningPage.className='turning-page';
    book.classList.remove('is-flipping');
    flipping=false;
  }

  function keyFlip(event,direction){
    if(event.key==='Enter'||event.key===' '){event.preventDefault();flip(direction);}
  }

  rightPage.addEventListener('click',()=>flip(1));
  leftPage.addEventListener('click',()=>flip(-1));
  rightPage.addEventListener('keydown',event=>keyFlip(event,1));
  leftPage.addEventListener('keydown',event=>keyFlip(event,-1));
  next.addEventListener('click',event=>{event.stopPropagation();flip(1);});
  prev.addEventListener('click',event=>{event.stopPropagation();flip(-1);});

  book.addEventListener('pointerdown',event=>{
    if(event.target.closest('.book-control'))return;
    pointerId=event.pointerId;
    startX=event.clientX;
    book.setPointerCapture?.(pointerId);
  });
  book.addEventListener('pointerup',event=>{
    if(pointerId!==event.pointerId)return;
    const dx=event.clientX-startX;
    pointerId=null;
    book.releasePointerCapture?.(event.pointerId);
    if(Math.abs(dx)>34)flip(dx<0?1:-1);
  });
  book.addEventListener('pointercancel',()=>{pointerId=null;});

  render();
})();
