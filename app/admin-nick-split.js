(()=>{
  'use strict';
  const USERS_KEY='MCU_TRACKER_USERS_V1';
  const SESSION_KEY='MCU_TRACKER_SESSION_V1';
  const STATE_PREFIX='MCU_TRACKER_USER_STATE_V1_';
  const keyOf=v=>String(v||'').trim().toLocaleLowerCase('tr-TR');
  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}')||{}}catch{return {}}};
  const sessionKey=()=>localStorage.getItem(SESSION_KEY)||'';
  const current=()=>{const u=readUsers();return u[sessionKey()]||null};
  const primary=u=>keyOf(u?.username||u?.key)==='ovztur';

  function findUserByNick(nick){
    const wanted=keyOf(nick),users=readUsers();
    if(!wanted)return null;
    return Object.entries(users).find(([storedKey,u])=>keyOf(u?.username||u?.key||storedKey)===wanted)||null;
  }

  function deleteByNick(nick){
    if(!primary(current()))return {ok:false,msg:'Bu işlem yalnızca ovztur Ana Admin hesabından yapılabilir.'};
    const wanted=keyOf(nick);
    if(!wanted)return {ok:false,msg:'Silmek için bir kullanıcı nicki gir.'};
    if(wanted==='ovztur')return {ok:false,msg:'ovztur Ana Admin hesabı silinemez.'};
    const found=findUserByNick(wanted);
    if(!found)return {ok:false,msg:'Bu nick ile kayıtlı hesap bulunamadı.'};
    const [storedKey,target]=found,users=readUsers();
    delete users[storedKey];
    localStorage.setItem(USERS_KEY,JSON.stringify(users));
    const keys=new Set([storedKey,target?.key,target?.username].filter(Boolean).map(String));
    for(const k of keys)localStorage.removeItem(STATE_PREFIX+encodeURIComponent(k));
    return {ok:true,msg:`@${target?.username||storedKey} hesabı silindi.`};
  }

  function splitPanels(){
    if(!primary(current()))return;
    if(document.getElementById('mcuDeleteNickSeparatePanel'))return;
    const adminInput=document.getElementById('mcuAdminNick');
    const grantBtn=document.getElementById('mcuGrantNickBtn');
    if(!adminInput||!grantBtn)return;
    const panel=adminInput.closest('section.panel');
    if(!panel)return;
    const title=panel.querySelector('h3');
    if(title)title.textContent='👑 Nick ile Admin Yap';
    const desc=panel.querySelector('p.meta');
    if(desc)desc.textContent='Admin yapmak istediğin kayıtlı hesabın nickini yaz.';
    adminInput.placeholder='Admin yapılacak nick / örn. peter';
    panel.querySelector('#mcuDeleteNickBtn')?.remove();

    const delPanel=document.createElement('section');
    delPanel.className='panel';
    delPanel.id='mcuDeleteNickSeparatePanel';
    delPanel.innerHTML='<h3 style="margin-top:0">🗑️ Nick ile Hesap Sil</h3><p class="meta">Silmek istediğin hesabın nickini yaz. ovztur Ana Admin hesabı silinemez.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="mcuDeleteNickSeparate" class="search" style="flex:1;min-width:220px" placeholder="Silinecek nick / örn. peter"><button id="mcuDeleteNickSeparateBtn" class="secondary">🗑️ Hesabı Sil</button></div><div id="mcuDeleteNickSeparateStatus" class="meta" style="margin-top:8px"></div>';
    panel.insertAdjacentElement('afterend',delPanel);

    const input=delPanel.querySelector('#mcuDeleteNickSeparate');
    const btn=delPanel.querySelector('#mcuDeleteNickSeparateBtn');
    const status=delPanel.querySelector('#mcuDeleteNickSeparateStatus');
    const run=()=>{
      const nick=input.value.trim();
      if(!nick){status.textContent='Silmek için bir kullanıcı nicki gir.';return}
      if(keyOf(nick)==='ovztur'){status.textContent='ovztur Ana Admin hesabı silinemez.';return}
      if(!confirm(`@${nick} hesabı silinsin mi?\n\nBu hesaba ait yerel ilerleme verileri de silinecek.`))return;
      if(!confirm(`SON ONAY: @${nick} hesabını kalıcı olarak silmek istediğine emin misin?`))return;
      const r=deleteByNick(nick);
      status.textContent=r.msg;
      if(r.ok)setTimeout(()=>document.getElementById('adminMenuBtn')?.click(),80);
    };
    btn.addEventListener('click',run);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});
  }

  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminMenuBtn'))setTimeout(splitPanels,0);
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(splitPanels,300),{once:true});
  else setTimeout(splitPanels,300);
})();