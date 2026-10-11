import test from 'node:test';
import assert from 'node:assert/strict';
import {paintCrosshair,decodeShareCode} from '../js/cs2-crosshair.mjs';
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
