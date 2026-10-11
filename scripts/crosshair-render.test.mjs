import test from 'node:test';
import assert from 'node:assert/strict';
import {paintCrosshair,decodeShareCode,previewProblem} from '../js/cs2-crosshair.mjs';
import fs from 'node:fs';
function render(spec,dpr=1){
 globalThis.window={devicePixelRatio:dpr};
 const pixels=new Map();
 const ctx={setTransform(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(x,y,w,h){for(let i=Math.ceil(x);i<x+w;i++)for(let j=Math.ceil(y);j<y+h;j++)pixels.set(`${i},${j}`,this.fillStyle);}};
 const canvas={clientWidth:280,clientHeight:280,getContext(){return ctx;}};
 paintCrosshair(canvas,spec);return pixels;
}
const bench=JSON.parse(fs.readFileSync(new URL('../content/crosshairs.json',import.meta.url))).bench;
test('negative-gap yellow cross has uninterrupted colored arms at their overlap',()=>{
 const pixels=render(decodeShareCode(bench.find(x=>x.id==='yellow-classic').code));
 assert.equal(pixels.get('136,140'),'rgba(255,220,0,1)');
});
test('dot-only style does not draw arms',()=>{
 const pixels=render({...decodeShareCode(bench[0].code),style:6,centerDotEnabled:true});
 assert.equal(pixels.get('150,140'),'#1a2420');
});
const pack=JSON.parse(fs.readFileSync(new URL('../content/crosshairs.json',import.meta.url)));
test('the dated pro collection preserves all 20 player records and both code formats',()=>{
 assert.equal(pack.proCollection.entries.length,20);
 assert.equal(new Set(pack.proCollection.entries.map(x=>x.id)).size,20);
 assert.equal(pack.proCollection.sourceUrl,'https://csstats.gg/crosshairs');
 assert.equal(pack.proCollection.observedOn,'2026-10-11');
 for(const entry of pack.proCollection.entries){
   assert.match(entry.lastUsed,/^2026-\d{2}-\d{2}$/);
   assert.ok(entry.lastUsed<=pack.proCollection.observedOn);
   assert.ok(decodeShareCode(entry.code),entry.name);
 }
 assert.equal(pack.proCollection.entries.filter(x=>x.code.startsWith('CSGO-')).length,2);
 assert.deepEqual(pack.bench.map(x=>x.id),['cyan-static','green-dot','white-tight','yellow-classic','magenta','red-t']);
});
test('every supported pro code paints visible color, while unsupported circle style is explicit',()=>{
 const unsupported=[];
 for(const entry of pack.proCollection.entries){
   const spec=decodeShareCode(entry.code);
   if(previewProblem(spec)){unsupported.push(entry.name);assert.throws(()=>render(spec),/preview/i);continue;}
   const color=`rgba(${spec.red},${spec.green},${spec.blue},${spec.alpha/255})`;
   assert.ok([...render(spec).values()].includes(color),entry.name+' must paint its decoded color');
 }
 assert.deepEqual(unsupported,['karrigan']);
});
