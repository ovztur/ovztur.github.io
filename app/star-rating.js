(()=>{
  'use strict';
  const VERSION='1.6.17';
  const STYLE_ID='mcuStarRatingStyle';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .mcu-star-rating{margin-top:10px;display:grid;gap:9px}
      .mcu-star-row{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
      .mcu-star-btn{appearance:none;border:0;background:transparent;padding:1px 2px;min-width:0;box-shadow:none;font-size:28px;line-height:1;cursor:pointer;color:#747982;transition:transform .12s ease,color .12s ease,filter .12s ease}
      .mcu-star-btn:hover{transform:translateY(-1px) scale(1.08)}
      .mcu-star-btn.on{color:#f5c542;filter:drop-shadow(0 0 5px rgba(245,197,66,.28))}
      .mcu-star-btn:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:4px}
      .mcu-star-meta{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .mcu-star-score{font-weight:800}
      .mcu-star-clear{padding:5px 9px;font-size:12px}
    `;
    document.head.appendChild(style);
  }

  function enhanceRating(){
    const select=document.getElementById('personalRatingSelect');
    if(!select||select.dataset.mcuStars==='1')return;
    select.dataset.mcuStars='1';
    select.style.display='none';
    select.setAttribute('aria-hidden','true');

    const wrap=document.createElement('div');
    wrap.className='mcu-star-rating';
    wrap.dataset.version=VERSION;

    const row=document.createElement('div');
    row.className='mcu-star-row';
    row.setAttribute('role','radiogroup');
    row.setAttribute('aria-label','Kişisel puan');

    const meta=document.createElement('div');
    meta.className='mcu-star-meta';
    const score=document.createElement('span');
    score.className='mcu-star-score';
    const clear=document.createElement('button');
    clear.type='button';
    clear.className='secondary mcu-star-clear';
    clear.textContent='Puanı Kaldır';

    const buttons=[];
    const render=value=>{
      const v=Number(value)||0;
      buttons.forEach((btn,index)=>{
        const on=index+1<=v;
        btn.classList.toggle('on',on);
        btn.setAttribute('aria-checked',String(index+1===v));
        btn.title=`${index+1}/10 puan ver`;
      });
      score.textContent=v?`Puanın: ${v}/10`:'Henüz puan vermedin';
      clear.style.display=v?'inline-flex':'none';
    };

    for(let i=1;i<=10;i++){
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='mcu-star-btn';
      btn.textContent='★';
      btn.dataset.value=String(i);
      btn.setAttribute('role','radio');
      btn.setAttribute('aria-label',`${i} üzerinden 10 puan`);
      btn.addEventListener('click',()=>{
        select.value=String(i);
        select.dispatchEvent(new Event('change',{bubbles:true}));
        render(i);
      });
      btn.addEventListener('mouseenter',()=>buttons.forEach((b,index)=>b.classList.toggle('on',index+1<=i)));
      btn.addEventListener('mouseleave',()=>render(select.value));
      buttons.push(btn);
      row.appendChild(btn);
    }

    clear.addEventListener('click',()=>{
      select.value='0';
      select.dispatchEvent(new Event('change',{bubbles:true}));
      render(0);
    });

    meta.append(score,clear);
    wrap.append(row,meta);
    select.insertAdjacentElement('afterend',wrap);
    render(select.value);
  }

  function wrapOpenDetail(){
    try{
      const original=window.openDetail;
      if(typeof original!=='function'||original.__mcuStarRating)return;
      const wrapped=function(...args){
        const result=original.apply(this,args);
        enhanceRating();
        return result;
      };
      wrapped.__mcuStarRating=true;
      window.openDetail=wrapped;
    }catch{}
  }

  function install(){
    ensureStyle();
    wrapOpenDetail();
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('.detail-btn'))setTimeout(enhanceRating,0);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
