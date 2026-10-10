// Import a reviewed observation, never fetch credentials or platform sources.
const fs=require('node:fs'),path=require('node:path'),g=require('../js/growth-model.js');
const file=path.join(__dirname,'../content/growth-ledger.json');
if(!process.argv[2])throw Error('Usage: node scripts/import-growth.cjs reviewed-observation.json');
const incoming=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),data=JSON.parse(fs.readFileSync(file,'utf8'));
const s=data.series.find(s=>s.id===incoming.id);if(!s||!g.compatible(s,incoming))throw Error('Unknown or changed cohort/window/metric: create a separate reviewed series');
const p=incoming.point;if(!p||!Number.isFinite(Date.parse(p.captured_at))||!p.method||!p.evidence)throw Error('Timestamp, method and evidence required');
for(const k of ['views','interactions'])if(p[k]!==null&&(!Number.isFinite(p[k])||p[k]<0))throw Error('Invalid '+k);
const existing=s.points.find(x=>x.captured_at===p.captured_at);if(existing){if(JSON.stringify(existing)!==JSON.stringify(p))throw Error('Conflicting observation timestamp');console.log('Already imported');process.exit(0);}
if(s.metric==='post_plays'&&s.cohort.length>1){if(!Array.isArray(p.posts)||p.posts.length!==s.cohort.length||new Set(p.posts.map(x=>x.id)).size!==s.cohort.length||p.posts.some(x=>!s.cohort.includes(x.id)||!Number.isFinite(x.views)||x.views<0)||p.posts.reduce((n,x)=>n+x.views,0)!==p.views)throw Error('Exact per-post evidence and matching sum required');}
s.points.push(p);s.points.sort((a,b)=>Date.parse(a.captured_at)-Date.parse(b.captured_at));fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');console.log('Observation appended; publication still required');
