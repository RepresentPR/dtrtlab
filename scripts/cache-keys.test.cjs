// Regenerate with: node scripts/update-cache-manifest.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { MANIFEST, collect, keyList, sameKeys } = require('./update-cache-manifest.cjs');

test('served JS and CSS match the cache manifest', () => {
  const saved = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const { manifest, refs } = collect();
  const problems = [];
  for (const rel of Object.keys(manifest)) {
    if (!Object.prototype.hasOwnProperty.call(saved, rel)) problems.push('missing manifest entry ' + rel);
  }
  for (const rel of Object.keys(saved)) {
    if (!Object.prototype.hasOwnProperty.call(manifest, rel)) problems.push('extra manifest entry ' + rel);
  }
  for (const rel of Object.keys(manifest)) {
    if (!saved[rel]) continue;
    if (saved[rel].hash !== manifest[rel].hash) {
      problems.push(rel + ' hash changed; update scripts/cache-manifest.json in this commit');
      const oldKeys = keyList(saved[rel].key);
      for (const ref of refs[rel] || []) {
        if (oldKeys.includes(ref.key)) problems.push(ref.from + ' still loads ' + rel + ' with ?v=' + ref.key);
      }
    } else if (!sameKeys(saved[rel].key, manifest[rel].key)) {
      problems.push(rel + ' ?v= key changed; update scripts/cache-manifest.json in this commit');
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});
