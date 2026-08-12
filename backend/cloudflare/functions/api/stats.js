const headers=()=>({'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'});
function authorized(request,env){const h=request.headers.get('Authorization')||'';return !!env.ADMIN_TOKEN&&h===`Bearer ${env.ADMIN_TOKEN}`}
export async function onRequestGet({request,env}){
  if(!authorized(request,env)) return new Response(JSON.stringify({error:'unauthorized'}),{status:401,headers:headers()});
  const url=new URL(request.url);const raw=url.searchParams.get('days')||'30';const days=raw==='all'?3650:Math.max(1,Math.min(3650,Number(raw)||30));const since=new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10);
  const totals=(await env.ANALYTICS.prepare(`SELECT event,SUM(count) count FROM event_counters WHERE day>=?1 GROUP BY event ORDER BY count DESC`).bind(since).all()).results||[];
  const daily=(await env.ANALYTICS.prepare(`SELECT day,event,SUM(count) count FROM event_counters WHERE day>=?1 GROUP BY day,event ORDER BY day ASC`).bind(since).all()).results||[];
  const versions=(await env.ANALYTICS.prepare(`SELECT version,SUM(count) count FROM event_counters WHERE day>=?1 AND event='app_open' GROUP BY version ORDER BY count DESC`).bind(since).all()).results||[];
  return new Response(JSON.stringify({ok:true,since,days,totals,daily,versions,privacy:{storesPersonalData:false,storedFields:['day','event','version','count']}}),{headers:headers()});
}
