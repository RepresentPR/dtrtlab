const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root=path.resolve(__dirname,'..');

function run(search='') {
  const fields={};
  const handlers={};let calls=0;
  const next={value:'https://dtrtlab.com/map/thanks/'};
  const form={querySelector:s=>s==='input[name="_next"]'?next:fields[s]||null,appendChild:e=>{fields[`input[name="${e.name}"]`]=e;}};
  const reference={hidden:true,textContent:''};
  const doc={querySelectorAll:()=>[form],createElement:()=>({}),getElementById:id=>id==='request-reference'?reference:null};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/intake-reference.js'),'utf8'),{document:doc,window:{addEventListener:(name,fn)=>{handlers[name]=fn;}},location:{search},crypto:{randomUUID:()=> (++calls===1?'12345678-1234-4234-8234-123456789abc':'87654321-4321-4321-8321-123456789abc')},URL,URLSearchParams,Date});
  return {fields,reference,form,next,handlers};
}
test('returning through browser cache gives the next request a new reference in both field and redirect',()=>{
  const state=run();const first=state.fields['input[name="Request reference"]'].value;
  assert.equal(typeof state.handlers.pageshow,'function');state.handlers.pageshow({persisted:true});
  const second=state.fields['input[name="Request reference"]'].value;
  assert.notEqual(first,second);assert.equal(new URL(state.next.value).searchParams.get('reference'),second);
});
test('request references are submitted as a field and survive the provider redirect without personal data',()=>{
  const {fields,next}=run();
  assert.match(fields['input[name="Request reference"]'].value,/^DTRT-\d{8}-[a-f0-9]{12}$/);
  assert.equal(new URL(next.value).searchParams.get('reference'),fields['input[name="Request reference"]'].value);
});
test('confirmation displays only valid request references as text',()=>{
  const good=run('?reference=DTRT-20261022-123456781234').reference;
  assert.equal(good.hidden,false);
  assert.equal(good.textContent,'Your request reference: DTRT-20261022-123456781234');
  const bad=run('?reference=%3Cimg%20src=x%20onerror=alert(1)%3E').reference;
  assert.equal(bad.hidden,true);assert.equal(bad.textContent,'');
});
test('all existing request forms provide source and load the reference script; thanks pages show its output',()=>{
  for(const file of ['map/index.html','contact.html','bug.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/name="_url" value="https:\/\/dtrtlab\.com\//,file);
    assert.match(html,/\/js\/intake-reference\.js\?v=20261022-1/,file);
    assert.doesNotMatch(html,/@gmail\.com|name="_cc"/,file);
  }
  for(const file of ['map/thanks/index.html','contact/thanks/index.html','bug/thanks/index.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/id="request-reference"[^>]*hidden/,file);
    assert.match(html,/\/js\/intake-reference\.js\?v=20261022-1/,file);
  }
});
