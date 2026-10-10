(()=>{'use strict';
 const panel=document.getElementById('insights');
 function revealAnchor(){let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}if(target&&panel.contains(target)){panel.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}}
 revealAnchor();window.addEventListener('hashchange',revealAnchor);
 const frame=document.querySelector('.stage .frame'),status=document.getElementById('lp');
 const cover=document.createElement('div');cover.className='studio-offline';cover.hidden=true;cover.innerHTML='<span class="studio-kicker">BETWEEN STREAMS</span><strong>The next round is coming.</strong><p>Catch up on the Lab Files while we’re offline.</p><a href="https://www.youtube.com/watch?v=lsExh8z7fVI">Watch the latest episode ↗</a>';frame.appendChild(cover);
 function sync(){const offline=status.textContent.toLowerCase().includes('not live');cover.hidden=!offline;const player=frame.querySelector('iframe');player.hidden=offline;}
 new MutationObserver(sync).observe(status,{childList:true,subtree:true,characterData:true});sync();
})();
