(()=>{const $=s=>document.querySelector(s),K='dtrt-hq-pw';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function decrypt(pw){const r=await fetch('/live/owner.enc.json?t='+Date.now(),{cache:'no-store'});const e=await r.json();
const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(e.salt),iterations:e.iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(e.iv)},key,b64(e.ct));return JSON.parse(new TextDecoder().decode(pt));}
const fmt=v=>v==null?null:(typeof v==='number'?v.toLocaleString('en-US',{maximumFractionDigits:2}):v);
function spark(vals,w=120,h=28){const v=vals.filter(x=>x!=null);if(v.length<2)return'';const mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1;
const pts=v.map((x,i)=>`${(i/(v.length-1)*w).toFixed(1)},${(h-2-(x-mn)/r*(h-4)).toFixed(1)}`).join(' ');
return `<svg viewBox="0 0 ${w} ${h}" style="max-width:${w}px"><polyline fill="none" stroke="#13C27A" stroke-width="2" points="${pts}"/></svg>`}
function delta7(hist,k){const t=hist[hist.length-1];if(!t||t[k]==null)return null;const cut=new Date(t.date);cut.setDate(cut.getDate()-7);
const old=hist.filter(d=>new Date(d.date)<=cut&&d[k]!=null);if(!old.length)return'7d: building history';const d=t[k]-old[old.length-1][k];return(d>=0?'+':'')+fmt(d)+' vs 7d'}
function tile(label,val,hist,k,extra,na){if(val==null)return`<div class="tile na"><small>${label}</small><strong>${na||'not connected yet'}</strong></div>`;
const d=k?delta7(hist,k):null;const cls=d&&d[0]==='+'&&d!=='+0 vs 7d'?'up':(d&&d[0]==='-'?'dn':'');
return`<div class="tile"><small>${label}</small><strong>${fmt(val)}</strong><span class="d ${cls}">${d||extra||''}</span>${k?spark(hist.map(x=>x[k])):''}</div>`}
function chart(el,series,opts={}){const W=640,H=200,P=30;const all=series.flatMap(s=>s.pts.map(p=>p[1])).filter(v=>v!=null);
if(!all.length){el.innerHTML='<p class="note">No data yet.</p>';return}
const xs=series[0].pts.map(p=>p[0]);const mx=Math.max(...all,1),mn=opts.zero?0:Math.min(...all);const r=mx-mn||1;const n=Math.max(xs.length-1,1);
const X=i=>P+i/n*(W-P-8),Y=v=>H-P-(v-mn)/r*(H-P-10);let g=`<svg viewBox="0 0 ${W} ${H}"><g stroke="#1d4a80">${[0,.5,1].map(f=>`<line x1="${P}" x2="${W-8}" y1="${Y(mn+f*r)}" y2="${Y(mn+f*r)}"/>`).join('')}</g>`;
g+=`<g fill="#9DB3CF" font-size="10">${[0,.5,1].map(f=>`<text x="0" y="${Y(mn+f*r)+3}">${Math.round(mn+f*r)}</text>`).join('')}<text x="${P}" y="${H-8}">${xs[0]}</text><text x="${W-70}" y="${H-8}">${xs[xs.length-1]}</text></g>`;
series.forEach(s=>{if(opts.bars){const bw=(W-P-8)/xs.length*.7;s.pts.forEach((p,i)=>{if(p[1]!=null)g+=`<rect x="${X(i)-bw/2}" y="${Y(p[1])}" width="${bw}" height="${H-P-Y(p[1])}" fill="${s.c}"/>`})}
else{const pts=s.pts.map((p,i)=>p[1]==null?null:`${X(i)},${Y(p[1])}`).filter(Boolean);g+=`<polyline fill="none" stroke="${s.c}" stroke-width="2.5" points="${pts.join(' ')}"/>`+pts.map(q=>`<circle r="3" fill="${s.c}" cx="${q.split(',')[0]}" cy="${q.split(',')[1]}"/>`).join('')}});
g+=`<g font-size="11">${series.map((s,i)=>`<text x="${P+i*120}" y="12" fill="${s.c}">■ ${s.n}</text>`).join('')}</g></svg>`;el.innerHTML=g}
function render(o){const h=o.history,t=o.today;$('#stamp').textContent=`Last updated ${o.meta.updated_et} · brain ${o.meta.brain_at} · sources ${o.meta.sources_fetched_et||'n/a'} ET · day ${o.meta.days_running}`;
const f=t.followers||{};$('#t-aud').innerHTML=[tile('Followers (known total)',t.followers_total_known,h,'followers_total_known',t.followers_complete?'':'partial: '+Object.entries(f).filter(e=>e[1]!=null).map(e=>e[0]).join(', ')+' only'),
...['x','instagram','tiktok','youtube','twitch'].map(p=>tile(p==='x'?'X':p[0].toUpperCase()+p.slice(1),f[p],null,null)),tile('Posts published',t.posts_published,h,'posts_published')].join('');
chart($('#c-fol'),[{n:'followers (known)',c:'#13C27A',pts:h.map(d=>[d.date,d.followers_total_known])}]);$('#n-fol').textContent=t.followers_complete?'All platforms counted.':'Missing platforms are excluded, not estimated.';
const PC={x:'#EAF2FB',instagram:'#E1306C',tiktok:'#25F4EE',youtube:'#FF4E45',twitch:'#9146FF'};
chart($('#c-plat'),Object.keys(PC).map(p=>({n:p,c:PC[p],pts:h.map(d=>[d.date,(d.followers||{})[p]??null])})),{zero:1});
const pb=o.posts_by_day||{};chart($('#c-posts'),[{n:'posts/day',c:'#13C27A',pts:Object.entries(pb)}],{bars:1,zero:1});
$('#t-pipe').innerHTML=[tile('Leads tracked',t.leads,h,'leads'),tile('Pitches drafted',t.pitches,h,'pitches'),tile('Pitched (sent)',t.pitched,h,'pitched'),tile('Won',t.won,h,'won'),tile('Form submissions',t.form_submissions,h,'form_submissions'),tile('Site visits (7d)',t.site_visits_7d,h,'site_visits_7d')].join('');
$('#t-rev').innerHTML=[tile('Whop orders',t.whop_orders,h,'whop_orders'),tile('Whop members',t.whop_members,h,'whop_members'),tile('Whop revenue total ($, rounded)',t.revenue_total_usd_rounded,h,'revenue_total_usd_rounded')].join('');
$('#t-data').innerHTML=[tile('Brain notes',t.notes,h,'notes'),tile('Sources cited',t.sources,h,'sources'),tile('Links per note',t.links_per_note,h,'links_per_note')].join('');
chart($('#c-brain'),[{n:'notes',c:'#13C27A',pts:h.map(d=>[d.date,d.notes])},{n:'links ÷10',c:'#5BC0EB',pts:h.map(d=>[d.date,d.links==null?null:Math.round(d.links/10)])},{n:'sources',c:'#F4D35E',pts:h.map(d=>[d.date,d.sources])}],{zero:1});
chart($('#c-new'),[{n:'new notes',c:'#13C27A',pts:h.map(d=>[d.date,d.new_notes])}],{bars:1,zero:1});
$('#nc').innerHTML=(o.not_connected||[]).map(x=>`<li>${x}</li>`).join('')||'<li>everything connected</li>';$('#lock').hidden=true;$('#dash').hidden=false}
// Password handling: by default it lives only in this tab's memory (needed for the 5-min refresh) and is never written to storage.
// It is saved in localStorage only when the owner explicitly ticks "remember on this device".
let mem=null;
async function open(pw,save){try{const o=await decrypt(pw);mem=pw;if(save)localStorage.setItem(K,pw);else localStorage.removeItem(K);render(o)}catch(e){mem=null;localStorage.removeItem(K);$('#err').textContent='Wrong password or data not published yet.'}}
$('#f').addEventListener('submit',e=>{e.preventDefault();const pw=$('#pw').value;$('#pw').value='';open(pw,$('#rem').checked)});
$('#out').addEventListener('click',()=>{mem=null;localStorage.removeItem(K);location.reload()});
const s=localStorage.getItem(K);if(s){$('#rem').checked=true;open(s,true)}setInterval(()=>{const p=mem||localStorage.getItem(K);if(p&&!$('#dash').hidden)open(p,!!localStorage.getItem(K))},300000)})();
