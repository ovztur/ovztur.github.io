(()=>{
  'use strict';
  function removeIMDbExternalLink(){
    const modal=document.getElementById('modal');
    if(!modal)return;
    [...modal.querySelectorAll('button')].forEach(btn=>{
      if((btn.textContent||'').trim()==='IMDb Sayfası')btn.remove();
    });
  }

  function install(){
    try{
      const original=window.openDetail;
      if(typeof original==='function'&&!original.__mcuIMDbInApp){
        const wrapped=function(...args){
          const result=original.apply(this,args);
          removeIMDbExternalLink();
          return result;
        };
        wrapped.__mcuIMDbInApp=true;
        window.openDetail=wrapped;
      }
    }catch{}
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('.detail-btn'))setTimeout(removeIMDbExternalLink,0);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
