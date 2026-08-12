const ALLOWED=new Set(['app_open','register','login','logout','movie_completed','season_completed','trophy_unlocked','progress_reset','update_check','update_install','update_error','download_click','site_view']);
const cors=()=>({'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'});
export async function onRequestOptions(){return new Response(null,{status:204,headers:cors()})}
export async function onRequestPost({request,env}){
  try{
    const body=await request.json();
    const event=String(body?.event||'').trim();
    const version=String(body?.version||'unknown').trim().slice(0,32)||'unknown';
    const count=Math.max(1,Math.min(50,Number(body?.count)||1));
    if(!ALLOWED.has(event)) return Response.json({ok:false,error:'invalid_event'},{status:400,headers:cors()});
    const day=new Date().toISOString().slice(0,10);
    await env.ANALYTICS.prepare(`INSERT INTO event_counters(day,event,version,count) VALUES(?1,?2,?3,?4) ON CONFLICT(day,event,version) DO UPDATE SET count=count+excluded.count`).bind(day,event,version,count).run();
    return Response.json({ok:true},{headers:cors()});
  }catch{return Response.json({ok:false,error:'bad_request'},{status:400,headers:cors()})}
}
