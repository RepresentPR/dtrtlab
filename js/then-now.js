/* Dated public snapshots; stats.json is a saved observation, not a live platform feed. */
(function(){
"use strict";
const host=document.getElementById("then-now");
if(!host)return;
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=x=>Number.isFinite(Number(x))?Number(x).toLocaleString("en-US"):"—";
const date=x=>{const d=new Date(x);return isNaN(d)?"Unknown":d.toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})+" ET"};
const name={youtube:"YouTube",tiktok:"TikTok",instagram:"Instagram",x:"X",twitch:"Twitch",kick:"Kick"};
const safeUrl=x=>/^https:\/\//.test(String(x||""))?esc(x):"#";
function change(a,b,precise=true){
 if(!Number.isFinite(a)||!Number.isFinite(b)||!precise)return "Unavailable";
 const delta=b-a, sign=delta>0?"+":"";
 return sign+num(delta)+(a>0?" ("+sign+(delta/a*100).toFixed(1)+"%)":"");
}
async function json(path){const r=await fetch(path+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(path);return r.json()}
function draw(B,O,S,C){
 const latest=new Date(S.generated_at),snap=new Date(B.first_platform_snapshot.at),hasLatest=!isNaN(latest)&&latest>snap;
 const baseline=B.first_measured_views.views,now=S.totals&&S.totals.views;
 const measured=Number.isFinite(now)&&now>=baseline&&new Date(S.generated_at)>new Date(B.first_measured_views.at);
 const caption="Saved public snapshot: "+date(S.generated_at)+". Page checks the saved files every 5 minutes.";
 const summary=measured?change(baseline,now)+" tracked post views since "+date(B.first_measured_views.at):"A later comparable view count is unavailable";
 const platforms=(S.platforms||[]).map(p=>{
  const old=(B.first_platform_snapshot.platforms||[]).find(q=>q.id===p.id)||{};
  const exact=!p.followers_rounded&&!old.followers_rounded&&p.id!=="instagram";
  const follower=exact&&hasLatest?change(old.followers,p.followers):"Unavailable";
  const view=hasLatest&&Number.isFinite(p.views)&&Number.isFinite(old.views)?change(old.views,p.views):"Unavailable";
  const caution=p.id==="instagram"?" Saved follower count conflicts with a later public observation.":p.followers_rounded?" Follower count rounded by platform.":"";
  return '<tr><th scope="row"><a href="'+safeUrl(p.url)+'" target="_blank" rel="noopener noreferrer">'+esc(name[p.id]||p.label||p.id)+'</a></th><td>'+num(old.views)+' → '+num(p.views)+'<br><small>'+esc(view)+'</small></td><td>'+num(old.followers)+(old.followers_rounded?"+":"")+' → '+num(p.followers)+(p.followers_rounded?"+":"")+'<br><small>'+esc(follower+caution)+'</small></td></tr>';
 }).join("");
 const clips=(C.clips||[]).filter(c=>Number.isFinite(c.views)).sort((a,b)=>b.views-a.views).slice(0,5).map(c=>'<li><a href="'+safeUrl(c.links&&c.links.youtube)+'" target="_blank" rel="noopener noreferrer">'+esc(c.title)+'</a>: '+num(c.views)+' saved views <small>(posted '+esc(c.posted_et||date(c.posted_utc))+')</small></li>').join("");
 const history=(O.observations||[]).concat((S.history||[]).map(h=>({at:h.at.replace(" ","T")+":00-04:00",views:h.views,followers:h.followers}))).filter(h=>!isNaN(new Date(h.at))).sort((a,b)=>new Date(a.at)-new Date(b.at));
 const seen=new Set();const log=history.filter(h=>{const k=new Date(h.at).getTime()+":"+h.views+":"+h.followers;if(seen.has(k))return false;seen.add(k);return true}).map((h,i,all)=>{const prev=all[i-1],d=prev&&Number.isFinite(h.views)&&Number.isFinite(prev.views)?change(prev.views,h.views):"first recorded";return '<tr><td>'+esc(date(h.at))+'</td><td>'+num(h.views)+'</td><td>'+esc(d)+'</td></tr>'}).join("");
 host.innerHTML='<div class="tn-head"><div><p class="eb">Recurring audience report</p><h2>Then vs. now</h2><p class="tn-note">Requested 30-day window: Sep 10–Oct 9, 2026 ET. Saved measurements begin Oct 8, so this is a partial-window report.</p></div><p class="tn-stamp">'+esc(caption)+'</p></div>'+
 '<div class="tn-kpis"><div class="tn-kpi"><span>First measured · '+esc(date(B.first_measured_views.at))+'</span><strong>'+num(baseline)+'</strong><span>tracked post views</span></div><div class="tn-kpi"><span>Latest saved · '+esc(date(S.generated_at))+'</span><strong>'+num(now)+'</strong><span>tracked post views</span></div><div class="tn-kpi"><span>Measured change</span><strong>'+esc(measured?change(baseline,now):"—")+'</strong><span>Since first measured count; not 30-day growth</span></div></div>'+
 '<p class="tn-alert">'+esc(summary)+'. Public post counters can rise as new posts are added and existing posts receive views. The records do not establish which change caused the increase.</p>'+
 '<details><summary>Platform-by-platform measurements</summary><p class="tn-note">Starting platform snapshot: '+esc(date(B.first_platform_snapshot.at))+'. Latest saved platform snapshot: '+esc(date(S.generated_at))+'. “Unavailable” means no reliable comparison.</p><div class="tn-scroll"><table><thead><tr><th>Channel</th><th>Tracked post views: then → now</th><th>Followers: then → now</th></tr></thead><tbody>'+platforms+'</tbody></table></div><p>Per-platform baselines before '+esc(date(B.first_platform_snapshot.at))+' were not saved. Twitch and Kick views are not tracked. Cross-platform totals count views, not unique people.</p></details>'+
 '<details><summary>Top content in the latest saved clip file</summary><p class="tn-note">Ranked by saved summed views across linked posts. Posts have different ages; this is not a controlled format comparison.</p><ol style="padding-left:24px;margin:10px 0">'+clips+'</ol><p>First long video: <a href="'+safeUrl(S.lab_file_001&&S.lab_file_001.url)+'" target="_blank" rel="noopener noreferrer">'+esc(S.lab_file_001&&S.lab_file_001.title||"Lab File #001")+'</a> · '+num(S.lab_file_001&&S.lab_file_001.views)+' saved views at '+esc(date(S.generated_at))+'.</p></details>'+
 '<details><summary>Dated view-count log</summary><p class="tn-note">Historical rows are preserved separately from the latest stats file. They show observations, not a continuous audience feed.</p><div class="tn-scroll"><table><thead><tr><th>Observed</th><th>Tracked views</th><th>Change from prior row</th></tr></thead><tbody>'+log+'</tbody></table></div></details>'+
 '<details><summary>What changed, what is unknown, and next tests</summary><h3>Observed</h3><ul><li>The saved tracker recorded '+num(baseline)+' views at '+esc(date(B.first_measured_views.at))+' and '+num(now)+' at '+esc(date(S.generated_at))+'.</li><li>Connected publishing history begins Oct 8; it does not prove there were no earlier posts outside that tool.</li></ul><h3>Data gaps</h3><ul><li>No Sep 10 baseline, complete 30-day views, or exact 30-day follower change.</li><li>No verified traffic sources, watch time, retention, click-through rate, conversion, or unique audience totals.</li><li>Saved YouTube follower count is rounded; saved Instagram follower count conflicts with a later public profile observation.</li></ul><h3>Next experiments</h3><ul><li>Record platform analytics exports and an exact baseline at the same time each day, then compare equal post-age windows.</li><li>Test two clip openings on the same platform, measuring 24-hour views and retention before attributing a result.</li><li>Use labeled website links to measure referrals when site analytics are available.</li></ul><p class="tn-note">These are proposed tests, not proven causes of the observed change.</p></details>'+
 '<p class="tn-note">Sources: <a href="../content/growth-baseline.json">locked baseline</a>, <a href="../content/growth-observations.json">dated observations</a>, <a href="../content/stats.json">latest saved stats</a>, and <a href="../content/clips.json">clip counts</a>. The page refreshes saved files; it does not pull live platform analytics.</p>';
}
async function load(){
 try{const [b,o,s,c]=await Promise.all([json("../content/growth-baseline.json"),json("../content/growth-observations.json"),json("../content/stats.json"),json("../content/clips.json")]);draw(b,o,s,c)}
 catch(e){if(!host.querySelector(".tn-head"))host.innerHTML='<h2>Then vs. now</h2><p>Saved growth measurements are unavailable right now.</p>';else{const p=host.querySelector(".tn-stamp");if(p)p.textContent="Could not refresh. Showing the last saved measurements."}}
}
load();setInterval(load,300000);
})();
