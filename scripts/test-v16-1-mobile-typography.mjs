import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  `${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/playwright`
);

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const PORT = Number(process.env.MNH_V16_1_PORT || 4185);
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const EVIDENCE_DIR =
  process.env.MNH_V16_1_EVIDENCE ||
  '/Users/hoainam/.gemini/antigravity/brain/1a0c6f22-0569-45b7-8304-88ae98029e72/v16-1-evidence';

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

function walkFiles(dir, ext) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

/**
 * Static AST audit across src TSX files ensuring every <br> between word tokens
 * has explicit separating whitespace so hidden <br> or textContent cannot glue words.
 */
function runStaticAstAudit() {
  const tsxFiles = walkFiles(SRC_DIR, '.tsx').sort();
  const violations = [];

  for (const filePath of tsxFiles) {
    const rel = path.relative(ROOT, filePath);
    const code = fs.readFileSync(filePath, 'utf8');
    const sf = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    function visit(node) {
      if ((ts.isJsxElement(node) || ts.isJsxFragment(node)) && node.children?.length) {
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const isBr =
            ts.isJsxSelfClosingElement(child) &&
            ts.isIdentifier(child.tagName) &&
            child.tagName.text.toLowerCase() === 'br';
          if (!isBr) continue;

          const prev = i > 0 ? children[i - 1] : null;
          const next = i + 1 < children.length ? children[i + 1] : null;

          const hasLeadingSpace =
            (prev && ts.isJsxExpression(prev) && prev.expression && ts.isStringLiteral(prev.expression) && /\s$/.test(prev.expression.text)) ||
            (prev && ts.isJsxText(prev) && /\s$/.test(prev.getFullText(sf)));

          const hasTrailingSpace =
            (next && ts.isJsxExpression(next) && next.expression && ts.isStringLiteral(next.expression) && /^\s/.test(next.expression.text)) ||
            (next && ts.isJsxText(next) && /^\s/.test(next.getFullText(sf)));

          if (!hasLeadingSpace && !hasTrailingSpace) {
            const line = sf.getLineAndCharacterOfPosition(child.getStart(sf)).line + 1;
            violations.push(`${rel}:${line} <br /> lacks adjacent JSX whitespace ({' '})`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sf);
  }

  assert.equal(
    violations.length,
    0,
    `Static JSX <br /> spacing violations:\n${violations.join('\n')}`
  );
  console.log(`✓ Static TSX AST audit passed across ${tsxFiles.length} files (0 unspaced <br /> elements)`);
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry until preview server is ready
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Preview server timeout at ${url}`);
}

async function inspectCurrentDom(page) {
  return await page.evaluate(() => {
    const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
    const brIssues = [];

    for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,dd,dt,blockquote,figcaption,label,button,a,li,span')) {
      for (const br of el.querySelectorAll('br')) {
        const prev = br.previousSibling?.textContent || '';
        const next = br.nextSibling?.textContent || '';
        const brDisp = getComputedStyle(br).display;
        if (prev && next && !/\s$/.test(prev) && !/^\s/.test(next)) {
          brIssues.push({
            tag: el.tagName,
            id: el.id || '',
            brDisp,
            prevEnd: prev.slice(-15),
            nextStart: next.slice(0, 15),
          });
        }
      }
    }

    const atelierH2 = document.getElementById('atelier-intro-title');
    const atelierP = atelierH2?.parentElement?.querySelector('p:not(.atelier-intro-eyebrow)') || null;
    const atelierBr = atelierH2?.querySelector('br') || null;

    return {
      docOverflow,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      brIssues,
      atelier: atelierH2
        ? {
            h2Inner: atelierH2.innerText,
            h2Text: atelierH2.textContent,
            brDisplay: atelierBr ? getComputedStyle(atelierBr).display : 'missing',
            pInner: atelierP?.innerText || '',
            pText: atelierP?.textContent || '',
          }
        : null,
    };
  });
}

async function runBrowserSuite() {
  if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    throw new Error('dist/index.html missing — run npm run build first.');
  }

  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`✓ Preview server ready at ${BASE_URL}`);

    const chrome = await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });
    const wk = await webkit.launch();

    const EXPECTED_H2_SINGLE_LINE = 'Có điều gì bạn muốn gửi mà lời nói chưa thể diễn tả?';
    const EXPECTED_H2_TWO_LINE = 'Có điều gì bạn muốn gửi\nmà lời nói chưa thể diễn tả?';
    const EXPECTED_P_TEXT =
      'Một lời cảm ơn. Một chút nhớ. Một mong ước bình an. Hãy để hương trà bắt đầu câu chuyện của bạn.';

    const ALL_ROUTES = [
      '/',
      '#/san-pham',
      '#/san-pham/buoi-an',
      '#/san-pham/hop-qua-tam-y',
      '#/cau-chuyen',
      '#/chon-qua',
      '#/qua-doanh-nghiep',
      '#/lien-he',
      '#/thanh-toan',
      '#/tai-khoan',
      '#/admin',
    ];

    const VIEWPORTS = [
      { width: 320, height: 568 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    const engines = [
      { name: 'Chromium', browser: chrome },
      { name: 'WebKit', browser: wk },
    ];

    for (const { name, browser } of engines) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);

        for (const route of ALL_ROUTES) {
          if (route === '#/thanh-toan') {
            await page.evaluate(() => {
              localStorage.setItem(
                'mnh_cart_items_v1',
                JSON.stringify([
                  {
                    product: {
                      id: 'buoi-an',
                      name: 'Trà Hương Bưởi – AN',
                      shortName: 'AN',
                      emotion: 'AN',
                      price: 289000,
                      image: '/assets/figma/product-an-main.png',
                      category: 'Set Quà Tặng',
                    },
                    quantity: 1,
                  },
                ])
              );
            });
          }

          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(100);

          const res = await inspectCurrentDom(page);
          assert.ok(
            res.docOverflow <= 2,
            `${name} ${vp.width}px ${route}: horizontal overflow (${res.scrollWidth} > ${res.innerWidth})`
          );
          assert.equal(
            res.brIssues.length,
            0,
            `${name} ${vp.width}px ${route}: unspaced <br> found: ${JSON.stringify(res.brIssues)}`
          );

          if (route === '/') {
            assert.ok(res.atelier, `${name} ${vp.width}px: #atelier-intro-title missing`);
            assert.doesNotMatch(res.atelier.h2Inner, /gửimà/);
            assert.equal(res.atelier.h2Text, EXPECTED_H2_SINGLE_LINE);
            assert.equal(res.atelier.pText, EXPECTED_P_TEXT);

            if (res.atelier.brDisplay === 'none') {
              assert.equal(
                res.atelier.h2Inner,
                EXPECTED_H2_SINGLE_LINE,
                `${name} ${vp.width}px: mobile heading innerText mismatch`
              );
            } else {
              assert.equal(
                res.atelier.h2Inner,
                EXPECTED_H2_TWO_LINE,
                `${name} ${vp.width}px: desktop heading line-break regression`
              );
            }
          }

          if (route === '#/thanh-toan' && vp.width === 375) {
            const h3Clip = await page.locator('main h3').first().evaluate((el) => ({
              text: el.innerText.trim(),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              whiteSpace: getComputedStyle(el).whiteSpace,
            }));
            assert.equal(h3Clip.text, 'Trà Hương Hoa Bưởi – AN');
            assert.notEqual(h3Clip.whiteSpace, 'nowrap', `${name} Checkout title still nowrap-clipped`);
          }
        }
      }

      // Interactive GiftJourney Steps 1-5 on mobile 375px
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE_URL}#/chon-qua`, { waitUntil: 'networkidle' });
      await page.locator('.journey-intentions button').first().click({ timeout: 3000 });
      for (let i = 0; i < 5; i++) {
        await page.locator('.journey-progress button').nth(i).click({ timeout: 3000 });
        await page.waitForTimeout(100);
        const stepRes = await inspectCurrentDom(page);
        assert.ok(stepRes.docOverflow <= 2, `${name} GiftJourney step ${i + 1} overflow`);
        assert.equal(
          stepRes.brIssues.length,
          0,
          `${name} GiftJourney step ${i + 1} <br> issue: ${JSON.stringify(stepRes.brIssues)}`
        );
      }

      // Check Corporate Gifting page normalized copy across mobile & desktop
      for (const vp of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(vp);
        await page.goto(`${BASE_URL}#/qua-doanh-nghiep`, { waitUntil: 'networkidle' });
        const corpText = await page.locator('#corporate-title').evaluate((el) => el.textContent);
        assert.equal(corpText, 'Lời tri ân, được trao bằng hương trà.');
        const res = await inspectCurrentDom(page);
        assert.equal(res.brIssues.length, 0);
        assert.ok(res.docOverflow <= 2);
      }

      assert.equal(pageErrors.length, 0, `${name} pageErrors: ${pageErrors.join('; ')}`);
      assert.equal(consoleErrors.length, 0, `${name} consoleErrors: ${consoleErrors.join('; ')}`);
      await context.close();
      console.log(`✓ ${name} passed all 8 viewports × 11 routes + GiftJourney 5 steps + Checkout check`);
    }

    // Simulated iPhone Facebook in-app WebKit User-Agent test (emulated iOS WebKit — not real iOS app hardware)
    const fbIosCtx = await wk.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 [FBAN/FBIOS;FBAV/468.0.0.42.109]',
    });
    const fbPage = await fbIosCtx.newPage();
    await fbPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await fbPage.evaluate(() => document.fonts.ready);
    const fbDom = await inspectCurrentDom(fbPage);
    assert.equal(fbDom.atelier.brDisplay, 'none');
    assert.equal(fbDom.atelier.h2Inner, EXPECTED_H2_SINGLE_LINE);
    assert.doesNotMatch(fbDom.atelier.h2Inner, /gửimà/);
    assert.ok(fbDom.docOverflow <= 2);
    await fbPage.locator('.atelier-introduction').scrollIntoViewIfNeeded();
    await fbPage.waitForTimeout(200);
    await fbPage.locator('.atelier-introduction').screenshot({
      path: path.join(EVIDENCE_DIR, 'verified-ios-fb-webkit-390.png'),
    });
    await fbIosCtx.close();
    console.log('✓ WebKit iOS Facebook-style UA (emulated) verified + screenshot saved');

    await chrome.close();
    await wk.close();
  } finally {
    server.kill('SIGTERM');
  }
}

runStaticAstAudit();
await runBrowserSuite();
console.log('\n🎉 V16.1 MOBILE TYPOGRAPHY REGRESSION SUITE PASSED!');
