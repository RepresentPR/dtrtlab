/* DTRTLab.com // goals.js - "Follower Goals = Rewards" ladder.
   Reads content/goals.json (tiers) + content/stats.json (live follower counts). Mount: <section data-goals></section>.
   Read-only, no keys. Unapproved add-ons are never shown publicly. */
(function(){
var me=document.currentScript&&document.currentScript.src||location.href;
var GOALS=new URL('../content/goals.json',me).href,STATS=new URL('../content/stats.json',me).href;
var css='.gl{--a:#CFE35A;--c:#15171A;--l:#25282D;--t:#ECE7DA;--m:#8C9097;--d:#5E626A;color:var(--t);font-family:inherit}'+
'.gl-h{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8px 20px;margin-bottom:16px}'+
'.gl-eb{font-size:12px;letter-spacing:.18em;color:var(--a);font-weight:700;text-transform:uppercase}'+
'.gl-h h2{font-size:clamp(24px,3vw,34px);font-weight:700;letter-spacing:-.01em;margin:4px 0 0;line-height:1.1}'+
'.gl-h p{color:var(--m);font-size:15px;margin:6px 0 0;max-width:620px}'+
'.gl-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}'+
'.gl-c{background:var(--c);border:1px solid var(--l);border-radius:14px;padding:18px 18px 12px;position:relative}'+
'.gl-c.hot{border-color:rgba(207,227,90,.45)}'+
'.gl-top{display:flex;align-items:baseline;gap:10px}.gl-top b{font-size:16px;font-weight:700}.gl-top .gl-n{margin-left:auto;font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}'+
'.gl-top .gl-n small{font-size:13px;color:var(--d);font-weight:600}'+
'.gl-nx{font-size:12px;letter-spacing:.08em;color:var(--m);margin-top:4px;text-transform:uppercase;font-weight:600}.gl-nx em{color:var(--a);font-style:normal}'+
'.gl-bar{height:8px;border-radius:4px;background:#22252a;overflow:hidden;margin:10px 0 12px}.gl-bar i{display:block;height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,#9fb23c,var(--a));transition:width 1.4s cubic-bezier(.2,.8,.2,1)}'+
'.gl-t{list-style:none;margin:0;padding:0}.gl-t li{display:grid;grid-template-columns:52px 1fr auto;gap:10px;align-items:start;padding:9px 0;border-top:1px solid var(--l);font-size:14px;line-height:1.35}'+
'.gl-t .gl-at{font-weight:700;font-variant-numeric:tabular-nums;color:var(--m)}.gl-t .gl-rw b{display:block;font-weight:600}.gl-t .gl-rw span{display:block;color:var(--d);font-size:12.5px;margin-top:2px}'+
'.gl-t .gl-st{font-size:10.5px;letter-spacing:.1em;font-weight:700;border-radius:9px;padding:2px 8px;white-space:nowrap;border:1px solid var(--l);color:var(--d)}'+
'.gl-t li.done .gl-at{color:var(--a)}.gl-t li.done .gl-st{color:var(--a);border-color:rgba(207,227,90,.4)}'+
'.gl-t li.next{background:linear-gradient(90deg,rgba(207,227,90,.07),transparent);margin:0 -18px;padding:9px 18px}.gl-t li.next .gl-at{color:var(--t)}.gl-t li.next .gl-st{background:var(--a);color:#0D0E10;border-color:var(--a)}'+
'.gl-t li.tbc .gl-st{color:#c9a36a;border-color:rgba(201,163,106,.4)}'+
'.gl-p{font-size:10.5px;letter-spacing:.1em;font-weight:700;color:var(--m);border:1px solid var(--l);border-radius:9px;padding:2px 8px}'+
'.gl-f{font-size:12px;color:var(--d);margin-top:12px;line-height:1.6}'+
'@media(max-width:640px){.gl-t li{grid-template-columns:44px 1fr auto}}';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&','<':'<','>':'>','"':'"'}[c]})}
function fmt(n){return n==null?'—':Number(n).toLocaleString('en-US')}
function get(u){return fetch(u+(u.indexOf('?')<0?'?':'&')+'t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
function counts(G,S){var c={};var sn=(G&&G.snapshot)||{};Object.keys(sn).forEach(function(k){if(typeof sn[k]==='number')c[k]=sn[k]});
 ((S&&S.platforms)||[]).forEach(function(p){if(p&&p.id&&typeof p.followers==='number')c[p.id]=p.followers});return c}
function card(L,n){var T=(L.tiers||[]).slice().sort(function(a,b){return a.at-b.at});var nx=null,prev=0;
 T.forEach(function(t){if(n>=t.at)prev=t.at;else if(!nx)nx=t});
 var pct=nx?Math.max(3,Math.min(100,(n-prev)/((nx.at-prev)||1)*100)):100;
 var head=nx?'Next reward at <em>'+fmt(nx.at)+'</em> · '+fmt(nx.at-n)+' to go':'<em>Every reward unlocked</em>';
 var rows=T.map(function(t){var done=n>=t.at,isn=t===nx,tbc=t.needs_approval&&!t.approved;
  var st=done?(tbc?'UNLOCKED · TBA':'UNLOCKED'):isn?'NEXT':(tbc?'DATE TBA':'LOCKED');
  var add=(t.optional_addon&&t.optional_addon.approved)?'<span>+ '+esc(t.optional_addon.reward)+'</span>':'';
  return '<li class="'+(done?'done':isn?'next':'')+(tbc?' tbc':'')+'"><span class="gl-at">'+fmt(t.at)+'</span><span class="gl-rw"><b>'+esc(t.reward)+'</b><span>'+esc(t.detail)+'</span>'+add+'</span><span class="gl-st">'+st+'</span></li>'}).join('');
 return '<div class="gl-c'+(nx&&nx.at-n<=Math.max(5,(nx.at-prev)*.25)?' hot':'')+'"><div class="gl-top"><b>'+esc(L.label)+'</b>'+(L.paused?'<span class="gl-p">PAUSED</span>':'')+'<span class="gl-n">'+fmt(n)+(L.rounded?'+':'')+(nx?'<small> / '+fmt(nx.at)+'</small>':'')+'</span></div>'+
  '<div class="gl-nx">'+head+'</div><div class="gl-bar" role="progressbar" aria-valuemin="'+prev+'" aria-valuemax="'+(nx?nx.at:n)+'" aria-valuenow="'+n+'"><i data-w="'+pct.toFixed(1)+'"></i></div><ul class="gl-t">'+rows+'</ul></div>'}
function render(el,G,S){if(!G||!G.ladders)return;var c=counts(G,S);var only=(el.getAttribute('data-goals')||'').split(',').filter(Boolean);
 var Ls=G.ladders.filter(function(L){return c[L.platform]!=null&&(!only.length||only.indexOf(L.platform)>=0)});
 el.innerHTML='<div class="gl"><div class="gl-h"><div><div class="gl-eb">Community goals</div><h2>'+esc(G.title||'Follower Goals')+'</h2><p>'+esc(G.subtitle||'')+'</p></div></div><div class="gl-g">'+Ls.map(function(L){return card(L,c[L.platform])}).join('')+'</div><p class="gl-f">'+esc(G.fine_print||'')+'</p></div>';
 setTimeout(function(){el.querySelectorAll('[data-w]').forEach(function(e){e.style.width=e.getAttribute('data-w')+'%'})},150)}
function load(){var els=document.querySelectorAll('[data-goals]');if(!els.length)return;Promise.all([get(GOALS),get(STATS)]).then(function(r){els.forEach(function(el){render(el,r[0],r[1])})})}
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();setInterval(load,5*60*1000);
window.DTRTGoals={reload:load};
})();
