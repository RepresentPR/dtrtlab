/* UP NEXT schedule: reads ../content/schedule.json, highlights the current item by ET clock */
(function(){
const box=document.getElementById('sched');if(!box)return;
const TZ='America/New_York',esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function off(ms){const p={};new Intl.DateTimeFormat('en-US',{timeZone:TZ,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(ms)).forEach(x=>p[x.type]=x.value);return Date.UTC(+p.year,p.month-1,+p.day,+p.hour%24,+p.minute,+p.second)-ms;}
function etMs(s){if(!s)return NaN;s=String(s);if(/[zZ]|[+-]\d\d:?\d\d$/.test(s))return Date.parse(s);const m=s.match(/^(\d{4})-(\d\d)-(\d\d)[ T](\d{1,2}):(\d\d)/);if(!m)return NaN;const g=Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5]);let t=g-off(g);t=g-off(t);return t;}
const hm=ms=>new Date(ms).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});
let D=null,showDone=false,stats=null;
function compute(now){const it=(D.items||[]).map(x=>Object.assign({},x,{t:etMs(x.time)})).filter(x=>!isNaN(x.t)).sort((a,b)=>a.t-b.t);
 it.forEach((x,i)=>{x.e=x.end?etMs(x.end):(it[i+1]?it[i+1].t:x.t+30*60000);});
 const manual=D.mode==='manual';
 if(manual){it.forEach(x=>x.s=x.status||'later');}
 else{it.forEach(x=>{const fixed=x.status==='done'||x.status==='skipped';x.s=fixed?'done':(now>=x.e?'done':(now>=x.t?'now':'later'));});
  const nx=it.find(x=>x.s==='later');if(nx)nx.s='next';}
 return it;}
function goals(){const G=D.goals||[];if(!G.length)return'';const P=(stats&&stats.platforms)||[];
 return '<div class="sc-gl"><div class="sc-k">Goals</div>'+G.map(g=>{const p=P.find(q=>q.id===g.platform)||{},n=p[g.metric||'followers'];const has=n!=null&&g.target;const pct=has?Math.max(3,Math.min(100,n/g.target*100)):0;
 return `<div class="sc-gr"><div><b>${esc(g.title)}</b>${g.desc?`<small>${esc(g.desc)}</small>`:''}</div><div class="v">${has?(n>=g.target?'Reached ✓':Number(n).toLocaleString('en-US')+` ${g.metric==='views'?'views':'followers'}<small>goal ${Number(g.target).toLocaleString('en-US')}</small>`):'Goal: '+Number(g.target).toLocaleString('en-US')}</div>${has?`<div class="sc-bar"><i style="width:${pct.toFixed(1)}%"></i></div>`:''}</div>`}).join('')+'</div>';}
function cd(ms){if(ms<=0)return'any minute';const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(ss)}`:`${m}:${p(ss)}`;}
const ap=()=>D.approximate===false?'':'~';
function render(){if(!D)return;const now=Date.now(),it=compute(now),cur=it.find(x=>x.s==='now'),nx=it.find(x=>x.s==='next');
 const lbl={now:'On now',next:'Next',later:'Later',done:'Done'};
 let hero='';
 if(cur)hero+=`<div class="sc-hero on"><div class="sc-k"><i></i>On now · since ${ap()}${hm(cur.t)} ET</div><div class="sc-t">${esc(cur.title)}</div>${cur.group?`<div class="sc-g">${esc(cur.group)}</div>`:''}${cur.desc?`<div class="sc-d">${esc(cur.desc)}</div>`:''}</div>`;
 if(nx)hero+=`<div class="sc-hero"><div class="sc-k">Up next · ${ap()}${hm(nx.t)} ET</div><div class="sc-t">${esc(nx.title)}</div>${nx.group?`<div class="sc-g">${esc(nx.group)}</div>`:''}<div class="sc-cd"><b data-cd="${nx.t}">${cd(nx.t-now)}</b><span>${nx.t-now>0?'until it starts':''}</span></div></div>`;
 if(!cur&&!nx)hero=`<div class="sc-hero"><div class="sc-k">Schedule</div><div class="sc-t">That's all for tonight</div><div class="sc-d">The next plan will be posted here. Follow on Twitch to catch it live.</div></div>`;
 const done=it.filter(x=>x.s==='done'),hid=showDone?0:Math.max(0,done.length-1);let g=null,rows='';
 if(hid)rows+=`<button class="sc-more" data-more>Show ${hid} earlier item${hid>1?'s':''}</button>`;
 it.forEach((x,i)=>{if(x.s==='done'&&!showDone&&done.indexOf(x)<hid)return;const grp=x.group||null;if(grp&&grp!==g)rows+=`<div class="sc-grp">${esc(grp)}</div>`;g=grp;
  const t=x.url&&/^https:/.test(x.url)?`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`:esc(x.title);
  rows+=`<div class="sc-it ${x.s}"><span class="tm">${ap()}${hm(x.t)}</span><span class="dt"></span><div><div class="tt">${t}</div>${x.desc?`<div class="ds">${esc(x.desc)}</div>`:''}</div><span class="st">${lbl[x.s]||''}</span></div>`;});
 const up=D.updated_at?new Date(etMs(D.updated_at)):null;
 box.innerHTML=`<div class="ch"><h2>${esc(D.title||'Up Next on Stream')}</h2><span class="s">What is this? What Ian streams today. Times are Eastern (New York).</span><span class="b">${it.length} items</span></div><div class="sc-in"><div class="sc-l">${hero}${goals()}<p class="sc-fine">${esc(D.note||'Times are approximate (ET).')}${up&&!isNaN(up)?' Updated '+hm(+up)+' ET.':''}</p></div><div class="sc-r">${rows}</div></div>`;
 const b=box.querySelector('[data-more]');if(b)b.onclick=()=>{showDone=true;render();};
 box.style.display='';}
let last='';
function tick(){if(!D)return;const k=compute(Date.now()).map(x=>x.s).join();if(k!==last){last=k;render();return;}
 box.querySelectorAll('[data-cd]').forEach(e=>e.textContent=cd(+e.dataset.cd-Date.now()));}
async function load(){try{const r=await fetch('../content/schedule.json?t='+Date.now(),{cache:'no-store'});if(r.ok){D=await r.json();last='';tick();}}catch(e){}
 try{const r=await fetch('../content/stats.json?t='+Date.now(),{cache:'no-store'});if(r.ok){stats=await r.json();render();}}catch(e){}}
box.style.display='none';load();setInterval(load,60000);setInterval(tick,1000);
})();
