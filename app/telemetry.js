(()=>{
  'use strict';
  const CONFIG_URL='https://ovztur.github.io/config/analytics.json';
  const VERSION='1.5.1';
  let cfg={enabled:false,event_url:''};
  const once=new Set();

  async function loadConfig(){
    try{
      const r=await fetch(CONFIG_URL+'?t='+Date.now(),{cache:'no-store'});
      if(r.ok) cfg=await r.json();
    }catch{}
  }

  function send(event,count=1){
    if(!cfg?.enabled||!cfg?.event_url) return;
    const body=JSON.stringify({event:String(event),version:VERSION,count:Number(count)||1});
    try{
      if(navigator.sendBeacon){
        const blob=new Blob([body],{type:'application/json'});
        if(navigator.sendBeacon(cfg.event_url,blob)) return;
      }
    }catch{}
    fetch(cfg.event_url,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,cache:'no-store'}).catch(()=>{});
  }

  function sendOnce(key,event){
    if(once.has(key)) return;
    once.add(key);
    send(event);
  }

  function wrap(name,make){
    try{
      const original=window[name];
      if(typeof original!=='function'||original.__mcuTelemetryWrapped) return;
      const wrapped=make(original);
      wrapped.__mcuTelemetryWrapped=true;
      window[name]=wrapped;
    }catch{}
  }

  function install(){
    sendOnce('app_open','app_open');

    wrap('loginUser',orig=>async function(key){
      const u=window.users?.[key];
      const isNew=!!u?.createdAt && (Date.now()-Number(u.createdAt)<15000);
      const out=await orig.apply(this,arguments);
      send(isNew?'register':'login');
      return out;
    });

    wrap('logout',orig=>function(){
      send('logout');
      return orig.apply(this,arguments);
    });

    wrap('setMovieWatched',orig=>function(item,value){
      let before=false;
      try{before=!!window.state?.watched?.[window.idOf(item)]}catch{}
      const out=orig.apply(this,arguments);
      if(value&&!before) send('movie_completed');
      return out;
    });

    wrap('setSeriesWatched',orig=>function(show,season,value){
      let before=false;
      try{before=!!window.state?.watched?.[window.idOf(show,'series',season)]}catch{}
      const out=orig.apply(this,arguments);
      if(value&&!before) send('season_completed');
      return out;
    });

    wrap('enqueueTrophy',orig=>function(a){
      if(a&&!a.testMode) send('trophy_unlocked');
      return orig.apply(this,arguments);
    });

    wrap('resetAccountProgress',orig=>function(){
      const before=JSON.stringify(window.state||{});
      const out=orig.apply(this,arguments);
      setTimeout(()=>{try{if(JSON.stringify(window.state||{})!==before)send('progress_reset')}catch{}},0);
      return out;
    });
  }

  loadConfig().finally(()=>{
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});
    else setTimeout(install,0);
  });
})();
