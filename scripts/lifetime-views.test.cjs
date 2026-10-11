const test = require('node:test');
const assert = require('node:assert/strict');
const {createViewModel} = require('../js/campaign-home.js');
test('lifetime inventory remains separate from campaign progress',()=>{
 const v=createViewModel({campaign:{viewsGoal:250000},results:{views:{status:'verified',value:685,observedAt:'2026-10-11T14:00:00Z'},lifetimeViews:{status:'verified',value:30000,observedAt:'2026-10-11T14:00:00Z'}}},Date.parse('2026-10-11T15:00:00Z'));
 assert.equal(v.lifetimeViews.value,30000);assert.equal(v.views.value,685);assert.equal(v.views.progress,685/250000*100);
});
test('unknown lifetime inventory is withheld',()=>assert.equal(createViewModel({}).lifetimeViews.value,null));
