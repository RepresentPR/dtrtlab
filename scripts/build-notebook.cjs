// Rewrite the public notebook page, the homepage Updated stamp, and sitemap
// lastmod values from content/notebook.txt.
'use strict';
const { writeSite } = require('./notebook.cjs');

if (require.main === module) {
  const { iso, cards } = writeSite();
  process.stdout.write(`notebook ${iso} (${cards} cards)\n`);
}
