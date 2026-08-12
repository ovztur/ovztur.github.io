(()=>{
  'use strict';
  const VERSION='1.6.13';
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
    setTimeout(()=>location.reload(),50);
    return{ok:true,msg:`@${target.username||storedKey} hesabı silindi.`};
  }

  function confirmDelete(label){
    if(!confirm(`${label} hesabı silinsin mi?\n\nBu işlem geri alınamaz.`))return false;
    return confirm('Son onay: Hesap ve bu hesaba ait yerel ilerleme verileri kalıcı olarak silinecek. Devam edilsin mi?');
  }

  function ensureSelfDelete(){
    const {key,user}=account();
    if(!user||primary(user))return;
    const box=document.getElementById('menuAccount');
    if(!box||box.querySelector('#mcuSelfDeleteBtn'))return;
    const btn=document.createElement('button');
    btn.id='mcuSelfDeleteBtn';
    btn.className='secondary';
    btn.textContent='🗑️ Hesabımı Sil';
    btn.style.cssText='width:100%;margin-top:8px';
    btn.onclick=()=>{
      const label='@'+(user.username||key);
      if(!confirmDelete(label))return;
      deleteStoredAccount(key);
    };
    box.appendChild(btn);
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