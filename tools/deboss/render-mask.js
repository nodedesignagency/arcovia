// The official lockup (site/assets/logo/lockup.svg, white) as a 2400px mask for deboss.py
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 2400 } });
  const fs = require('fs'), path = require('path');
  let svg = fs.readFileSync(path.join(__dirname, '../../site/assets/logo/lockup.svg'), 'utf8').replace('width="72" height="72"', 'style="display:block" width="2400" height="2400"');
  await p.setContent('<html style="background:#000"><body style="margin:0;background:#000;overflow:hidden">' + svg + '</body></html>');
  await p.screenshot({ path: require('path').join(__dirname, 'lockup-mask.png') });
  await b.close();
})();
