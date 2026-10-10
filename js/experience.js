(()=>{'use strict';
if(document.querySelector('.experience-controls'))return;
const root=document.documentElement;const home=location.pathname==='/'||location.pathname==='/index.html';if(home)document.body.classList.add('experience-home');
const mode=location.pathname.includes('radio')?'radio':location.pathname.includes('afterlight')||location.pathname.includes('story')?'story':location.pathname.includes('/live')?'live':'studio';document.body.dataset.experience=mode;
let preference=false;try{preference=sessionStorage.getItem('dtrt-sound')==='on';}catch{}
function remember(){try{sessionStorage.setItem('dtrt-sound',enabled?'on':'off');sessionStorage.setItem('dtrt-volume',volume.value);}catch{}}

const style=document.createElement('link');style.rel='stylesheet';style.href='/css/experience.css?v=20261010n';document.head.append(style);
const controls=document.createElement('div');controls.className='experience-controls';controls.innerHTML='<button type="button" class="sound-toggle" aria-pressed="false">Sound off <span aria-hidden="true">◌</span></button><label class="sound-volume">Volume <input type="range" min="0" max="100" value="25" aria-label="Sound volume"></label>';document.body.append(controls);
const button=controls.querySelector('button'),volume=controls.querySelector('input');
let ctx,master,enabled=false,lastTone=0;try{volume.value=sessionStorage.getItem('dtrt-volume')||'25';}catch{}
const notes=mode==='story'?[98,146.83,196,233.08]:mode==='live'?[130.81,196,261.63,329.63]:[110,164.81,220,261.63];
function build(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Audio unavailable');ctx=new AC();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
(mode==='radio'?[]:notes).forEach((frequency,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),depth=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.value=.025;lfo.frequency.value=.055+i*.018;depth.gain.value=.009;lfo.connect(depth);depth.connect(gain.gain);osc.connect(gain);gain.connect(master);osc.start();lfo.start();});}
function level(){if(master)master.gain.setTargetAtTime(enabled&&!document.hidden?Number(volume.value)/100:0,ctx.currentTime,.18);}
function tone(click=false){if(!enabled||!ctx||document.hidden)return;const now=ctx.currentTime;if(now-lastTone<.09)return;lastTone=now;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(click?440:660,now);o.frequency.exponentialRampToValueAtTime(click?880:440,now+.12);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.045,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+.16);o.connect(g);g.connect(master);o.start(now);o.stop(now+.18);o.onended=()=>{o.disconnect();g.disconnect();};}
button.addEventListener('click',async()=>{try{if(!ctx)build();if(ctx.state==='suspended')await ctx.resume();enabled=!enabled;button.setAttribute('aria-pressed',String(enabled));button.innerHTML=enabled?'Sound on <span aria-hidden="true">≋</span>':'Sound off <span aria-hidden="true">◌</span>';controls.classList.toggle('enabled',enabled);remember();level();if(enabled)tone(true);}catch{button.textContent='Sound unavailable';button.disabled=true;}});
volume.addEventListener('input',()=>{remember();level();});
if(preference){button.innerHTML='Resume sound <span aria-hidden="true">◌</span>';const resume=async e=>{if(controls.contains(e.target))return;document.removeEventListener('pointerdown',resume);try{if(!ctx)build();await ctx.resume();enabled=true;button.setAttribute('aria-pressed','true');button.innerHTML='Sound on <span aria-hidden="true">≋</span>';controls.classList.add('enabled');level();}catch{}};document.addEventListener('pointerdown',resume);button.addEventListener('click',()=>document.removeEventListener('pointerdown',resume),{once:true});}
document.addEventListener('visibilitychange',level);window.addEventListener('pagehide',()=>{enabled=false;level();});window.addEventListener('pageshow',()=>{if(!enabled){button.setAttribute('aria-pressed','false');button.innerHTML=preference&&!ctx?'Resume sound <span aria-hidden="true">◌</span>':'Sound off <span aria-hidden="true">◌</span>';controls.classList.remove('enabled');}});
document.addEventListener('pointerover',e=>{const target=e.target.closest('a,button');if(target&&!target.contains(e.relatedTarget)&&!controls.contains(target))tone();});document.addEventListener('focusin',e=>{if(e.target.closest('a,button')&&!controls.contains(e.target))tone();});document.addEventListener('click',e=>{if(e.target.closest('a')&&!controls.contains(e.target))tone(true);});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
if(!reduced.matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.section-head,.episode,.clip,.split,.income-card,.project-panel h2').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
const hero=home?document.querySelector('.hero'):null;if(hero){const visual=document.createElement('div');visual.className='orbital-scene';visual.setAttribute('aria-hidden','true');visual.innerHTML='<div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orbit orbit-c"></div><div class="orb-core"></div>';hero.prepend(visual);const eyebrow=hero.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='Every round has a turning point.';const hint=document.createElement('a');hint.className='scene-cue';hint.href='#clips';hint.textContent='Find your next moment ↓';hero.append(hint);}
const hooks={
'/afterlight.html':['DTRT / AFTERLIGHT','The island remembers. Will you?'],
'/radio.html':['DTRT / SOUND','A different frequency. Press play.'],
'/live/':['DTRT / LIVE ROOM','The next moment starts with the people here.'],
'/support.html':['DTRT / COMMUNITY','Help shape what happens next.'],
'/partners.html':['DTRT / PARTNERSHIPS','Make something worth paying attention to.'],
'/catalog.html':['DTRT / EXPLORE','Choose your next world.'],
'/story.html':['DTRT / STORIES','Every place holds a story. Step inside.']};
const hook=hooks[location.pathname];if(hook){const main=document.querySelector('main');const header=document.querySelector('header');if(main||header){const intro=document.createElement('div');intro.className='chapter-hook';const label=document.createElement('span'),line=document.createElement('p');label.textContent=hook[0];line.textContent=hook[1];intro.append(label,line);if(main)main.prepend(intro);else header.insertAdjacentElement('afterend',intro);}}
})();
