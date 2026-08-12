(()=>{
  'use strict';
  const VERSION='1.6.17';
  const DATA_URL='https://ovztur.github.io/app/imdb-ratings-data.js';
  let loading=null;

  function applyData(render=true){
    const data=window.MCU_IMDB_RATINGS;
    if(!data||!data.titles||!Object.keys(data.titles).length)return false;
    try{
      imdbCache={
        updatedAt:Number(data.updatedAt)||Date.now(),
        titles:{...(imdbCache?.titles||{}),...data.titles}
      };
      localStorage.setItem(imdbCacheKey,JSON.stringify(imdbCache));
      if(render&&typeof currentUser!=='undefined'&&currentUser&&typeof renderCurrent==='function')renderCurrent(false);
      return true;
    }catch(e){
      console.warn('IMDb yerel veri uygulama hatası:',e);
      return false;
    }
  }

  function loadFresh(){
    if(loading)return loading;
    loading=new Promise(resolve=>{
      const old=document.getElementById('mcuImdbRatingsDataScript');
      if(old)old.remove();
      const s=document.createElement('script');
      s.id='mcuImdbRatingsDataScript';
      s.src=DATA_URL+'?t='+Date.now();
      s.async=true;
      s.onload=()=>resolve(applyData(true));
      s.onerror=()=>resolve(false);
      (document.head||document.documentElement).appendChild(s);
    }).finally(()=>{loading=null});
    return loading;
  }

  async function refresh(force=true){
    const buttons=document.querySelectorAll('.imdb-refresh');
    buttons.forEach(b=>{b.disabled=true;b.textContent='IMDb güncelleniyor…'});
    try{
      const ok=await loadFresh();
      if(!ok)throw new Error('IMDb puan verisi yüklenemedi.');
      return true;
    }catch(err){
      console.warn('IMDb küçük veri dosyası yükleme hatası:',err);
      if(force)alert('IMDb verisi güncellenemedi: '+(err?.message||err));
      return false;
    }finally{
      document.querySelectorAll('.imdb-refresh').forEach(b=>{b.disabled=false;b.textContent='↻ IMDb Verisini Güncelle'});
    }
  }

  function install(){
    window.refreshIMDbRatings=refresh;
    if(window.MCU_IMDB_RATINGS)applyData(true);else loadFresh();
    setTimeout(()=>{if(!window.MCU_IMDB_RATINGS)loadFresh()},700);
    setTimeout(()=>{if(typeof imdbCache!=='undefined'&&!imdbCache?.updatedAt)loadFresh()},1800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
