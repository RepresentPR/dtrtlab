(function(root){
 'use strict';
 const latest=s=>(s.points||[]).slice().sort((a,b)=>Date.parse(a.captured_at)-Date.parse(b.captured_at)).pop()||{};
 const compatible=(a,b)=>a.platform===b.platform&&a.metric===b.metric&&a.window===b.window&&JSON.stringify([...a.cohort].sort())===JSON.stringify([...b.cohort].sort());
 function total(series){let n=0,found=false;const seen=new Set();for(const s of series){if(s.metric!=='post_plays')continue;for(const id of s.cohort){const key=s.platform+':'+id;if(seen.has(key))throw Error('overlapping post cohorts');seen.add(key);}const v=latest(s).views;if(Number.isFinite(v)){n+=v;found=true;}}return found?n:null;}
 const api={latest,compatible,total};if(typeof module==='object')module.exports=api;else root.DTRTGrowth=api;
})(typeof window==='object'?window:this);
