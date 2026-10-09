(function(){
"use strict";
const box=document.getElementById("stream-gain");if(!box)return;
const fmt=n=>Number.isFinite(n)?n.toLocaleString("en-US"):"—";
const et=s=>new Date(s).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET";
async function get(p){const r=await fetch(p+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(p);return r.json()}
function render(B,S){
 const t=new Date(S.generated_at).getTime(),start=new Date(B.first_verified_live_reading_at).getTime(),end=new Date(B.last_verified_same_session_at).getTime();
 const verified=Number.isFinite(t)&&t>=start&&t<=end&&!!(S.totals&&B.baseline&&S.totals.basis&&S.totals.basis===B.baseline.basis);
 const pts=[{t:start,v:B.baseline.tracked_post_views}].concat((S.history||[]).map(h=>({t:new Date(h.at.replace(" ","T")+":00-04:00").getTime(),v:h.views})).filter(p=>p.t>start&&p.t<=Math.min(t,end)&&Number.isFinite(p.v))).sort((a,b)=>a.t-b.t);
 const last=pts[pts.length-1],diff=verified&&Number.isFinite(last.v)?last.v-B.baseline.tracked_post_views:null;
 const values=pts.map(p=>p.v),lo=Math.min(...values),hi=Math.max(...values),span=Math.max(1,hi-lo);
 const xy=pts.map((p,i)=>[30+(p.t-start)/Math.max(1,end-start)*510,105-(p.v-lo)/span*60]);
 const path=xy.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
 const svg='<svg viewBox="0 0 600 150" role="img" aria-label="Tracked post views during the verified partial-session interval"><line x1="30" x2="570" y1="110" y2="110" stroke="#555"/><path d="'+path+'" fill="none" stroke="#CFE35A" stroke-width="3"/>'+xy.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#CFE35A"/>').join("")+'<text x="30" y="140" fill="#d0d3d8" font-size="16">First verified reading</text><text x="570" y="140" text-anchor="end" fill="#d0d3d8" font-size="16">Last verified reading</text></svg>';
 const rows=(S.platforms||[]).map(p=>{const old=B.baseline.platforms.find(q=>q.id===p.id);if(!old)return "";const vd=verified&&Number.isFinite(old.views)&&Number.isFinite(p.views)?p.views-old.views:null;const fd=verified&&!p.followers_rounded&&!old.followers_rounded&&p.id!=="instagram"&&Number.isFinite(old.followers)&&Number.isFinite(p.followers)?p.followers-old.followers:null;return '<tr><th>'+String(p.label||p.id)+'</th><td>'+ (vd===null?"Unavailable":(vd>0?"+":"")+fmt(vd))+'</td><td>'+(fd===null?"Unavailable":(fd>0?"+":"")+fmt(fd))+'</td></tr>'}).join("");
 box.innerHTML='<div class="ch"><h2>Gained this stream</h2><span class="s">Partial verified interval</span></div><div style="padding:10px 22px 20px"><p class="tn-note">Since the first saved reading while Twitch was live at '+et(B.first_verified_live_reading_at)+'. The actual stream start and stream ID were not recorded.</p><p class="tn-kpi" style="display:inline-block;margin:12px 0"><strong>'+(diff===null?"Unavailable":(diff>0?"+":"")+fmt(diff))+'</strong><span>tracked post views during the verified interval</span></p>'+svg+'<p class="tn-note">Last reading confirmed for this interval: '+et(B.last_verified_same_session_at)+'. These are saved public post-view totals, not stream viewers or views caused by the stream. A later snapshot cannot be assigned to this session without its stream ID.</p><details><summary>Platform changes during this interval</summary><div class="tn-scroll"><table><thead><tr><th>Channel</th><th>Post views gained</th><th>Followers gained</th></tr></thead><tbody>'+rows+'</tbody></table></div><p>Rounded YouTube followers and conflicting Instagram follower readings cannot support an exact gain.</p></details><p class="tn-note"><a href="../content/stream-session.json">Session baseline and limits</a></p></div>';
}
async function load(){try{const [b,s]=await Promise.all([get("../content/stream-session.json"),get("../content/stats.json")]);render(b,s)}catch(e){box.textContent="Partial stream measurements are unavailable."}}
load();setInterval(load,300000);
})();
