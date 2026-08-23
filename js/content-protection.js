(()=>{
  'use strict';

  const block=event=>event.preventDefault();

  document.addEventListener('copy',block);
  document.addEventListener('cut',block);
  document.addEventListener('contextmenu',block);
  document.addEventListener('dragstart',block);
  document.addEventListener('selectstart',block);

  document.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    const modifier=event.ctrlKey||event.metaKey;

    if(modifier&&['a','c','x','s','p','u'].includes(key)){
      event.preventDefault();
      return;
    }

    if((event.ctrlKey||event.metaKey)&&event.shiftKey&&['i','j','c'].includes(key)){
      event.preventDefault();
      return;
    }

    if(event.key==='F12')event.preventDefault();
  },true);
})();
