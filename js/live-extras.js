/* Live extras: latest supporters, Google review card, Free Promo spotlight (PR small businesses / creators).
   Data: content/supporters.json, content/reviews.json, content/promo.json. Nothing renders that is not real data.
   Works on /live (relative ../content) and in OBS (data-base="https://dtrtlab.com/content/"). */
(function(){
const root=document.getElementById('lfx');if(!root)return;
const BASE=root.dataset.base||'../content/',esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const https=u=>typeof u==='string'&&/^https:\/\//.test(u);
let SUP={},REV={reviews:[]},PRO={entries:[]},ri=0;
const get=async f=>{try{const r=await fetch(BASE+f+'?t='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}};
function supporters(){
 const ev=(window.LabLive&&LabLive.events)||[];const last=(types)=>{for(let i=ev.length-1;i>=0;i--){const e=ev[i];if(!e.test&&types.includes(e.type)&&e.user&&e.user!=='New follower')return e;}return null;};
 const f=last(['follow']),sb=last(['sub','gift']),d=last(['donation','bits']);
 const live={};if(f)live.follower={name:f.user};if(sb)live.subscriber={name:sb.user};if(d)live.donation={name:d.user,amount:d.type==='bits'?(d.amount+' '+(d.unit||'bits')):d.amount};
 const S=Object.assign({},SUP,live);
 const row=(k,l)=>{const v=S[k];const t=v&&v.name?esc(v.name)+(v.amount?' · '+esc(v.amount):''):'none yet';return `<div class="lfx-s"><span>${l}</span><b class="${v&&v.name?'':'none'}">${t}</b></div>`};
 return `<div class="lfx-k">Latest supporters</div>${row('follower','Follower')}${row('subscriber','Subscriber')}${row('donation','Donation')}`;}
function review(){
 const shop=REV.shop_name,g=REV.google_url;if(!shop||!https(g))return '';
 const R=(REV.reviews||[]).filter(r=>r&&r.stars===5&&r.show_name===true&&r.name&&r.text);
 let h=`<div class="lfx-k">Review us</div><div class="lfx-t">Enjoying the stream? A Google review of ${esc(shop)} truly helps grow our business.</div><a class="lfx-b" href="${esc(g)}" target="_blank" rel="noopener">Leave a Google review</a>`;
 if(https(REV.yelp_url))h+=` <a class="lfx-y" href="${esc(REV.yelp_url)}" target="_blank" rel="noopener">Find us on Yelp</a>`;
 if(R.length){const r=R[ri%R.length];h+=`<blockquote class="lfx-q" key="${ri}">★★★★★ “${esc(r.text)}” <cite>${esc(r.name)}</cite></blockquote>`;}
 return h;}
const MIN=()=>(PRO.minutes||20)*60000;
function promoState(now){const E=PRO.entries||[];if(!E.length)return null;const slot=Math.floor(now/MIN()),e=E[slot%E.length],into=now-slot*MIN(),nextIn=MIN()-into;return{e,slot,on:into<(PRO.show_seconds||45)*1000,nextIn};}
function promo(){const s=promoState(Date.now());if(!s)return '';const e=s.e,L=e.links||{};
 const names={website:'Website',instagram:'Instagram',x:'X',tiktok:'TikTok',youtube:'YouTube',linkedin:'LinkedIn'};
 const links=Object.keys(names).filter(k=>https(L[k])).map(k=>`<a href="${esc(L[k])}" target="_blank" rel="noopener">${names[k]}</a>`).join('');
 const m=Math.floor(s.nextIn/60000),sec=String(Math.floor(s.nextIn/1000)%60).padStart(2,'0');
 return `<div class="lfx-k">Free Promo · Puerto Rico ${esc(PRO.hashtag||'')}</div><div class="lfx-n ${s.on?'on':''}">${esc(e.name)}</div><div class="lfx-w">${esc(e.what||'')}${e.tag?' · '+esc(e.tag):''}</div><div class="lfx-l">${links}</div><div class="lfx-c">Next spotlight in ${m}:${sec}</div>`;}
function render(){const parts=[['sup',supporters()],['rev',review()],['pro',promo()]];
 root.innerHTML=parts.filter(p=>p[1]).map(p=>`<section class="lfx-card lfx-${p[0]}">${p[1]}</section>`).join('');}
async function load(){[SUP,REV,PRO]=[await get('supporters.json')||{},await get('reviews.json')||{reviews:[]},await get('promo.json')||{entries:[]}];render();}
load();setInterval(load,30000);setInterval(render,1000);setInterval(()=>{ri++},9000);
if(document.getElementById('lp')&&!window.DTRTLive){const l=document.createElement('link');l.rel='stylesheet';l.href='/css/live-pulse.css?v=1';document.head.appendChild(l);const j=document.createElement('script');j.src='/js/live-pulse.js?v=1';document.body.appendChild(j);}
})();
