(()=>{
  'use strict';
  const VERSION='1.6.7';
  const USERS_KEY='MCU_TRACKER_USERS_V1';
  const SESSION_KEY='MCU_TRACKER_SESSION_V1';
  const STATE_PREFIX='MCU_TRACKER_USER_STATE_V1_';
  const keyOf=v=>String(v||'').trim().toLocaleLowerCase('tr-TR');
  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}')||{}}catch{return {}}};
  const writeUsers=u=>localStorage.setItem(USERS_KEY,JSON.stringify(u));
  const sessionKey=()=>localStorage.getItem(SESSION_KEY)||'';
  const account=()=>{const users=readUsers(),key=sessionKey();return{users,key,user:users[key]||null}};
  const primary=u=>keyOf(u?.username||u?.key)==='ovztur';

  function findByNick(nick){
    const wanted=keyOf(nick),users=readUsers();
    return Object.entries(users).find(([storedKey,u])=>keyOf(u?.username||u?.key||storedKey)===wanted)||null;
  }

  function clearUserState(storedKey,user){
    const candidates=new Set([storedKey,user?.key,user?.username].filter(Boolean).map(String));
    for(const c of candidates)localStorage.removeItem(STATE_PREFIX+encodeURIComponent(c));
  }

  function deleteStoredAccount(storedKey,actorMode){
    const users=readUsers(),target=users[storedKey];
    if(!target)return{ok:false,msg:'Hesap bulunamadı.'};
    if(primary(target))return{ok:false,msg:'ovztur Ana Admin hesabı silinemez.'};
    const actor=account().user;
    const own=storedKey===sessionKey();
    if(actorMode==='self'&&!own)return{ok:false,msg:'Yalnızca kendi hesabını silebilirsin.'};
    if(actorMode==='primary'&&!primary(actor))return{ok:false,msg:'Diğer hesapları yalnızca ovztur Ana Admin silebilir.'};
    clearUserState(storedKey,target);
    delete users[storedKey];
    writeUsers(users);
    if(own){localStorage.removeItem(SESSION_KEY);setTimeout(()=>location.reload(),50)}
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
      deleteStoredAccount(key,'self');
    };
    box.appendChild(btn);
  }

  function injectPrimaryAdminDeletes(){
    const actor=account().user;
    if(!primary(actor))return;

    document.querySelectorAll('[data-admin-key]').forEach(roleBtn=>{
      const storedKey=roleBtn.dataset.adminKey;
      if(!storedKey||keyOf(storedKey)==='ovztur')return;
      const parent=roleBtn.parentElement;
      if(!parent||parent.querySelector(`[data-delete-account-key="${CSS.escape(storedKey)}"]`))return;
      const del=document.createElement('button');
      del.className='secondary';
      del.dataset.deleteAccountKey=storedKey;
      del.textContent='🗑️ Hesabı Sil';
      del.style.marginLeft='8px';
      del.onclick=()=>{
        const target=readUsers()[storedKey];if(!target)return;
        const label='@'+(target.username||storedKey);
        if(!confirmDelete(label))return;
        const r=deleteStoredAccount(storedKey,'primary');
        alert(r.msg);
        document.getElementById('adminMenuBtn')?.click();
      };
      parent.appendChild(del);
    });

    const nick=document.getElementById('mcuAdminNick'),grant=document.getElementById('mcuGrantNickBtn');
    if(nick&&grant&&!document.getElementById('mcuDeleteNickBtn')){
      const del=document.createElement('button');
      del.id='mcuDeleteNickBtn';
      del.className='secondary';
      del.textContent='Hesabı Sil';
      del.onclick=()=>{
        const found=findByNick(nick.value);
        if(!found){alert('Bu nick ile kayıtlı hesap bulunamadı.');return}
        const [storedKey,target]=found;
        if(primary(target)){alert('ovztur Ana Admin hesabı silinemez.');return}
        const label='@'+(target.username||storedKey);
        if(!confirmDelete(label))return;
        const r=deleteStoredAccount(storedKey,'primary');
        alert(r.msg);
        document.getElementById('adminMenuBtn')?.click();
      };
      grant.insertAdjacentElement('afterend',del);
    }
  }

  function refresh(){ensureSelfDelete();injectPrimaryAdminDeletes()}
  function install(){
    refresh();
    setTimeout(refresh,250);setTimeout(refresh,1000);
    document.addEventListener('click',()=>setTimeout(refresh,0),true);
    window.addEventListener('focus',refresh,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();