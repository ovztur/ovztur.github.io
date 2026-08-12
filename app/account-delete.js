(()=>{
  'use strict';
  const VERSION='1.6.17';
  const USERS_KEY='MCU_TRACKER_USERS_V1';
  const SESSION_KEY='MCU_TRACKER_SESSION_V1';
  const STATE_PREFIX='MCU_TRACKER_USER_STATE_V1_';
  const keyOf=v=>String(v||'').trim().toLocaleLowerCase('tr-TR');
  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}')||{}}catch{return {}}};
  const writeUsers=u=>localStorage.setItem(USERS_KEY,JSON.stringify(u));
  const sessionKey=()=>localStorage.getItem(SESSION_KEY)||'';
  const account=()=>{const users=readUsers(),key=sessionKey();return{users,key,user:users[key]||null}};
  const primary=u=>keyOf(u?.username||u?.key)==='ovztur';

  function clearUserState(storedKey,user){
    const candidates=new Set([storedKey,user?.key,user?.username].filter(Boolean).map(String));
    for(const c of candidates)localStorage.removeItem(STATE_PREFIX+encodeURIComponent(c));
  }

  function deleteStoredAccount(storedKey){
    const users=readUsers(),target=users[storedKey];
    if(!target)return{ok:false,msg:'Hesap bulunamadı.'};
    if(primary(target))return{ok:false,msg:'ovztur Ana Admin hesabı silinemez.'};
    if(storedKey!==sessionKey())return{ok:false,msg:'Yalnızca kendi hesabını silebilirsin.'};
    clearUserState(storedKey,target);
    delete users[storedKey];
    writeUsers(users);
    localStorage.removeItem(SESSION_KEY);
    setTimeout(()=>location.reload(),80);
    return{ok:true,msg:`@${target.username||storedKey} hesabı silindi.`};
  }

  function confirmDelete(label){
    if(!confirm(`${label} hesabı silinsin mi?\n\nBu işlem geri alınamaz.`))return false;
    return confirm('SON ONAY: Hesap ile bu hesaba ait izleme, favori, not, XP, kupa ve puan verileri kalıcı olarak silinecek. Devam edilsin mi?');
  }

  function ensureSelfDelete(){
    const {key,user}=account();
    const existing=document.getElementById('mcuSelfDeleteBtn');
    if(!user||primary(user)){
      existing?.remove();
      return;
    }
    if(existing)return;
    const side=document.getElementById('sideMenu');
    if(!side)return;
    const btn=document.createElement('button');
    btn.id='mcuSelfDeleteBtn';
    btn.className='menu-category';
    btn.type='button';
    btn.textContent='🗑️ Hesabımı Sil';
    btn.style.cssText='border-color:rgba(255,90,90,.35);color:#ffb3b3';
    btn.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      const now=account();
      if(!now.user||primary(now.user))return;
      const label='@'+(now.user.username||now.key);
      if(!confirmDelete(label))return;
      deleteStoredAccount(now.key);
    };
    const logout=document.getElementById('logoutBtn');
    if(logout)side.insertBefore(btn,logout);else side.appendChild(btn);
  }

  function install(){
    ensureSelfDelete();
    setTimeout(ensureSelfDelete,250);
    setTimeout(ensureSelfDelete,1000);
    document.addEventListener('click',()=>setTimeout(ensureSelfDelete,0),true);
    window.addEventListener('focus',ensureSelfDelete,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();