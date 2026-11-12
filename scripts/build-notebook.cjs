// Rewrite the public notebook page, the homepage Updated stamp, and sitemap
// lastmod values from content/notebook.txt.
'use strict';
const { writeSite } = require('./notebook.cjs');

if (require.main === module) {
  const { iso, entries } = writeSite();
  process.stdout.write(`notebook ${iso} (${entries} entries)\n`);
}
