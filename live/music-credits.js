(function(){const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const PL={afterlight:'AFTERLIGHT originals',reg_usa:'USA pack',reg_pr:'Puerto Rico / Latin pack',reg_global:'Global pack',bed_doc:'Show beds',bed_cine:'Show beds'};
fetch('../content/music-credits.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.tracks)return;
 const g={};j.tracks.forEach(t=>{const k=PL[t.pool]||'Other';(g[k]=g[k]||[]).push(t);});
 const sb=j.streambeats;document.getElementById('mcn').innerHTML=(sb?esc('All StreamBeats tracks: ')+'<a href="'+esc(sb.url)+'" target="_blank" rel="noopener noreferrer">'+esc(sb.name)+'</a>. ':'')+esc('Other tracks are copyright-free or Creative Commons and listed below with their licenses.');
 document.getElementById('mcs').textContent=j.tracks.length+' TRACKS'+(j.updated?' \u00b7 UPDATED '+j.updated:'');
 document.getElementById('mcl').innerHTML=Object.keys(g).map(k=>'<div class="cap" style="margin-top:10px">'+esc(k)+'</div>'+g[k].map(t=>'<div>'+(t.page&&/^https:/.test(t.page)?'<a href="'+esc(t.page)+'" target="_blank" rel="noopener noreferrer">'+esc(t.title)+'</a>':esc(t.title))+' <span style="color:var(--mute)">\u2014 '+esc(t.artist)+(t.license?' \u00b7 '+esc(t.license):'')+'</span></div>').join('')).join('');
 document.getElementById('mcredits').hidden=false;}).catch(()=>{});})();
