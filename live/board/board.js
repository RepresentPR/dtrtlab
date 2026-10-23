(()=>{const $=s=>document.getElementById(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NA='not measured yet';
function candles(c){if(!c.length)return`<div class="empty">Score history: ${NA}.<br>The first 4-hour candle appears after the first scored day.</div>`;
const W=Math.max(320,c.length*14),H=220,lo=Math.min(...c.map(x=>x.l)),hi=Math.max(...c.map(x=>x.h)),r=hi-lo||1,y=v=>(H-10-(v-lo)/r*(H-20)).toFixed(1);
return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily Improvement Score candles">`+c.map((x,i)=>{const up=x.c>=x.o,col=up?'#13C27A':'#E5484D',cx=i*14+7;
return`<line x1="${cx}" x2="${cx}" y1="${y(x.h)}" y2="${y(x.l)}" stroke="${col}"/><rect x="${cx-4}" width="8" y="${y(Math.max(x.o,x.c))}" height="${Math.max(1,Math.abs(y(x.o)-y(x.c)))}" fill="${col}"><title>${esc(x.t)} O${x.o} H${x.h} L${x.l} C${x.c}</title></rect>`}).join('')+'</svg>'}
function spark(c){const v=c.map(x=>x.c);if(v.length<2)return'';const mn=Math.min(...v),r=Math.max(...v)-mn||1;
return`<svg viewBox="0 0 100 24" width="100" height="24"><polyline fill="none" stroke="#13C27A" stroke-width="2" points="${v.map((x,i)=>`${(i/(v.length-1)*100).toFixed(1)},${(22-(x-mn)/r*20).toFixed(1)}`).join(' ')}"/></svg>`}
const rank=e=>e.pos==null||e.neg==null?null:e.pos-e.neg;
let D;function drawLog(){const by=$('sort').value,L=[...D.log];
L.sort(by==='rank'?(a,b)=>(rank(b)??-1e9)-(rank(a)??-1e9):(a,b)=>b.date.localeCompare(a.date));
$('log').innerHTML=L.map(e=>{const r=rank(e),cls=r==null?'':r>=0?'pos':'neg';
return`<li class="${cls}"><span class="d">${esc(e.date)}</span><span>${esc(e.title)}</span><span class="sc">${r==null?'not scored yet':`<b class="up">+${e.pos}</b> / <b class="down">−${e.neg}</b> · net ${r>=0?'+':''}${r}`}</span></li>`}).join('')}
fetch('/live/board/live.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(d=>{D=d;
$('upd').textContent='Updated '+new Date(d.updated).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/New_York'})+' ET';
const g=d.headline.growthPct7d,ge=$('g');if(g==null){ge.textContent=NA;ge.className='na'}else{ge.textContent=(g>=0?'+':'')+g.toFixed(1)+'%';ge.className=g>=0?'up':'down'}
$('spark').innerHTML=spark(d.candles);const fs=$('fs');fs.textContent=d.headline.firstSale?'Yes':'Not yet';fs.className=d.headline.firstSale?'up':'na';
$('nlog').textContent=d.log.length;$('chart').innerHTML=candles(d.candles);drawLog();$('sort').onchange=drawLog;
$('story').innerHTML=[...d.story].reverse().map(s=>`<li><span class="d">${esc(s.date)}</span> · ${esc(s.title)}</li>`).join('')}).catch(()=>{$('upd').textContent='Data unavailable'})})();
