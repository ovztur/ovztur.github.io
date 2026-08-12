(()=>{
  'use strict';
  // Legacy compatibility cleanup only. This file must never create Admin UI.
  function cleanup(){
    document.querySelectorAll('#mcuDeleteNickSeparatePanel').forEach(el=>el.remove());
    // If an old injected delete button was attached to the Admin nick row, remove it.
    const adminPanel=document.getElementById('mcuAdminNick')?.closest('section.panel');
    adminPanel?.querySelectorAll('#mcuDeleteNickSeparateBtn,[data-legacy-delete]').forEach(el=>el.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanup,{once:true});
  else cleanup();
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminMenuBtn'))setTimeout(cleanup,0);
  },true);
})();