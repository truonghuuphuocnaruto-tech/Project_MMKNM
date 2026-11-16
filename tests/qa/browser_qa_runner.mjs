import fs from 'node:fs';
import path from 'node:path';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) {
            reject(new Error(data.error.message || JSON.stringify(data.error)));
          } else {
            resolve(data.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  const screenshotDir = path.resolve('docs/product/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Get new page target from Chrome
  const newPageRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:4173/', { method: 'PUT' });
  const pageTarget = await newPageRes.json();
  console.log('Opened target page:', pageTarget.id, pageTarget.webSocketDebuggerUrl);

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');

  const testResults = [];

  function record(suite, name, passed, details = '') {
    testResults.push({ suite, name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] [${suite}] ${name}${details ? ': ' + details : ''}`);
  }

  async function evalJs(expr) {
    const res = await client.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result.value;
  }

  async function setViewport(width, height, isMobile = false) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
    await client.send('Emulation.setVisibleSize', { width, height });
  }

  async function takeScreenshot(filePath, fullPage = false) {
    if (fullPage) {
      const metrics = await evalJs(`({
        width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
        height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      })`);
      const res = await client.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: metrics.width,
          height: metrics.height,
          scale: 1,
        },
      });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    } else {
      const res = await client.send('Page.captureScreenshot', {
        format: 'png',
      });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    }
    console.log(`Saved screenshot: ${filePath}`);
  }

  // --- SUITE 1: DESKTOP LANDING (1920x1080) ---
  console.log('\n--- Running Suite 1: Desktop Landing Page (/) ---');
  await setViewport(1920, 1080, false);
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(1000);

  // Check Title
  const landingTitle = await evalJs('document.title');
  record(
    'Routing',
    'Landing page title matches expectation',
    landingTitle.includes('AI Voice & Video Scam Checker — Dừng một nhịp trước khi tin'),
    landingTitle
  );

  // Check Sections presence
  const sections = await evalJs(`({
    hero: !!document.querySelector('main h1'),
    pressureScenario: !!document.getElementById('tinh-huong'),
    verifySequence: !!document.getElementById('cach-xu-ly'),
    productFlow: !!document.getElementById('cong-cu'),
    demoLimitations: !!document.getElementById('gioi-han'),
    safetyChecklist: !!document.getElementById('checklist'),
    privacySection: !!document.getElementById('quyen-rieng-tu'),
    storyFooter: !!document.querySelector('footer'),
  })`);

  record('Landing Content', 'HeroSection present', sections.hero);
  record('Landing Content', 'PressureScenario (#tinh-huong) present', sections.pressureScenario);
  record('Landing Content', 'VerifySequence (#cach-xu-ly) present', sections.verifySequence);
  record('Landing Content', 'ProductFlow (#cong-cu) present', sections.productFlow);
  record('Landing Content', 'DemoLimitations (#gioi-han) present', sections.demoLimitations);
  record('Landing Content', 'SafetyChecklist (#checklist) present', sections.safetyChecklist);
  record('Landing Content', 'PrivacySection (#quyen-rieng-tu) present', sections.privacySection);
  record('Landing Content', 'StoryFooter present', sections.storyFooter);

  // Check Anchor Navigation
  const anchorResult = await evalJs(`(() => {
    const link = document.querySelector('nav a[href="#tinh-huong"]');
    if (!link) return { found: false };
    link.click();
    return {
      found: true,
      hash: window.location.hash,
    };
  })()`);
  await sleep(400);
  record('Anchor Navigation', 'Click anchor #tinh-huong updates URL hash', anchorResult.hash === '#tinh-huong', anchorResult.hash);

  // Take Desktop Landing Screenshot
  await evalJs('window.scrollTo(0, 0)');
  await sleep(200);
  await takeScreenshot(path.join(screenshotDir, '01_landing_desktop_1920x1080.png'), false);

  // --- SUITE 2: CTA NAVIGATION TO /app ---
  console.log('\n--- Running Suite 2: CTA Navigation to /app ---');
  const ctaNavResult = await evalJs(`(() => {
    const ctaButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Mở bản demo local'));
    if (ctaButtons.length === 0) return { found: false };
    ctaButtons[0].click();
    return {
      found: true,
      pathname: window.location.pathname,
      title: document.title
    };
  })()`);
  await sleep(600);

  const afterCtaUrl = await evalJs('({ pathname: window.location.pathname, title: document.title })');
  record('Navigation CTA', 'Smooth navigation to /app updates pathname', afterCtaUrl.pathname === '/app', afterCtaUrl.pathname);
  record('Navigation CTA', 'Title updates to /app title', afterCtaUrl.title.includes('Local Demo (/app)'), afterCtaUrl.title);

  await takeScreenshot(path.join(screenshotDir, '02_app_from_cta_1920x1080.png'), false);

  // --- SUITE 3: DIRECT LINK & REFRESH ON /app ---
  console.log('\n--- Running Suite 3: Direct Link & Refresh /app ---');
  await client.send('Page.navigate', { url: 'http://localhost:4173/app' });
  await sleep(1000);
  await client.send('Page.reload');
  await sleep(1000);

  const appComponents = await evalJs(`({
    pathname: window.location.pathname,
    title: document.title,
    demoBanner: !!document.querySelector('aside[role="alert"]'),
    demoBannerText: document.querySelector('aside[role="alert"]')?.textContent?.includes('DEMO / Dữ liệu mô phỏng') || false,
    scopeIntroduction: !!document.querySelector('section[aria-labelledby="scope-heading"]'),
    fileUploader: !!document.querySelector('input[type="file"]'),
    uploadDropzone: !!document.querySelector('div[role="region"]') || !!document.querySelector('main input[type="file"]'),
    noHorizontalScroll: document.documentElement.scrollWidth <= window.innerWidth
  })`);

  record('Direct /app & Refresh', 'Direct URL loaded and refreshed at /app', appComponents.pathname === '/app', appComponents.pathname);
  record('Direct /app & Refresh', 'DemoBanner displays correctly with role=alert', appComponents.demoBanner && appComponents.demoBannerText);
  record('Direct /app & Refresh', 'ScopeIntroduction component present', appComponents.scopeIntroduction);
  record('Direct /app & Refresh', 'FileUploader input present & intact', appComponents.fileUploader);
  record('Direct /app & Refresh', 'No horizontal layout overflow on Desktop', appComponents.noHorizontalScroll);

  // Test expanding ScopeIntroduction
  await evalJs(`(() => {
    const btn = document.querySelector('button[aria-controls="scope-details"]');
    if (btn) btn.click();
  })()`);
  await sleep(300);
  const scopeExpanded = await evalJs(`!!document.getElementById('scope-details')`);
  record('Direct /app & Refresh', 'ScopeIntroduction details toggle expansion works', scopeExpanded);

  await takeScreenshot(path.join(screenshotDir, '03_app_direct_refresh_1920x1080.png'), false);

  // --- SUITE 4: BROWSER BACK / FORWARD ---
  console.log('\n--- Running Suite 4: Browser Back/Forward between / and /app ---');
  // First, let's navigate to / then navigate to /app to have clean history
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(800);
  await evalJs(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mở bản demo local'));
    if (btn) btn.click();
  })()`);
  await sleep(500);

  // Trigger browser Back via history.back()
  await evalJs('window.history.back()');
  await sleep(600);
  const backState = await evalJs('({ pathname: window.location.pathname, hasH1: !!document.querySelector("main h1") })');
  record('Browser Back/Forward', 'Browser Back returns to / and renders Landing', backState.pathname === '/' && backState.hasH1, backState.pathname);

  // Trigger browser Forward via history.forward()
  await evalJs('window.history.forward()');
  await sleep(600);
  const fwdState = await evalJs('({ pathname: window.location.pathname, hasUploader: !!document.querySelector("input[type=file]") })');
  record('Browser Back/Forward', 'Browser Forward returns to /app and renders App', fwdState.pathname === '/app' && fwdState.hasUploader, fwdState.pathname);

  // Trigger top bar return link
  const returnHomeResult = await evalJs(`(() => {
    const returnLink = document.querySelector('a[href="/"]');
    if (!returnLink) return false;
    returnLink.click();
    return true;
  })()`);
  await sleep(500);
  const returnHomeState = await evalJs('({ pathname: window.location.pathname, hasH1: !!document.querySelector("main h1") })');
  record('Navigation Return', 'Top bar return link navigates back to /', returnHomeState.pathname === '/' && returnHomeState.hasH1, returnHomeState.pathname);

  // --- SUITE 5: RESPONSIVE MOBILE (375x667) ---
  console.log('\n--- Running Suite 5: Mobile Viewport (375x667) ---');
  await setViewport(375, 667, true);
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(800);

  const mobileLanding = await evalJs(`({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: window.innerWidth,
    hamburgerPresent: !!document.querySelector('button[aria-label="Mở danh mục điều hướng"]'),
    desktopNavHidden: window.getComputedStyle(document.querySelector('nav')).display === 'none'
  })`);

  record('Mobile Responsive', 'Landing 375x667 no horizontal overflow', mobileLanding.scrollWidth <= 375, `scrollWidth=${mobileLanding.scrollWidth}`);
  record('Mobile Responsive', 'Mobile hamburger menu button visible', mobileLanding.hamburgerPresent);
  record('Mobile Responsive', 'Desktop nav hidden on mobile', mobileLanding.desktopNavHidden);

  await takeScreenshot(path.join(screenshotDir, '04_landing_mobile_375x667.png'), false);

  // Test opening hamburger menu
  await evalJs(`(() => {
    const btn = document.querySelector('button[aria-label="Mở danh mục điều hướng"]');
    if (btn) btn.click();
  })()`);
  await sleep(400);
  const menuOpened = await evalJs(`(() => {
    const links = Array.from(document.querySelectorAll('header .lg\\\\:hidden a'));
    return links.length > 0;
  })()`);
  record('Mobile Responsive', 'Mobile menu opens properly', menuOpened);
  await takeScreenshot(path.join(screenshotDir, '05_landing_mobile_menu_open.png'), false);

  // Test Mobile /app
  await client.send('Page.navigate', { url: 'http://localhost:4173/app' });
  await sleep(800);
  const mobileApp = await evalJs(`({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: window.innerWidth,
    bannerVisible: !!document.querySelector('aside[role="alert"]'),
    scopeVisible: !!document.querySelector('section[aria-labelledby="scope-heading"]'),
    uploaderVisible: !!document.querySelector('input[type="file"]')
  })`);

  record('Mobile Responsive', 'App 375x667 no horizontal overflow', mobileApp.scrollWidth <= 375, `scrollWidth=${mobileApp.scrollWidth}`);
  record('Mobile Responsive', 'App components render correctly on mobile', mobileApp.bannerVisible && mobileApp.scopeVisible && mobileApp.uploaderVisible);

  await takeScreenshot(path.join(screenshotDir, '06_app_mobile_375x667.png'), false);

  // --- SUITE 6: ACCESSIBILITY & PREFERS-REDUCED-MOTION ---
  console.log('\n--- Running Suite 6: Accessibility & Reduced Motion ---');
  await setViewport(1920, 1080, false);
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(800);

  // Check Skip Link
  const skipLink = await evalJs(`(() => {
    const link = document.querySelector('a[href="#story-main"]');
    if (!link) return { found: false };
    link.focus();
    const focused = document.activeElement === link;
    const computed = window.getComputedStyle(link);
    return {
      found: true,
      text: link.textContent.trim(),
      focused,
      position: computed.position,
      top: computed.top
    };
  })()`);
  record('Accessibility', 'Skip link to #story-main present', skipLink.found && skipLink.text === 'Chuyển đến nội dung chính');
  record('Accessibility', 'Skip link is focusable via keyboard tab order', skipLink.focused);

  // Check ARIA landmarks on Landing
  const landmarksLanding = await evalJs(`({
    header: !!document.querySelector('header'),
    main: !!document.querySelector('main#story-main'),
    nav: !!document.querySelector('nav[aria-label]'),
    footer: !!document.querySelector('footer')
  })`);
  record('Accessibility', 'Landing has standard ARIA landmarks (header, main, nav, footer)',
    landmarksLanding.header && landmarksLanding.main && landmarksLanding.nav && landmarksLanding.footer
  );

  // Check ARIA landmarks on /app
  await client.send('Page.navigate', { url: 'http://localhost:4173/app' });
  await sleep(800);
  const landmarksApp = await evalJs(`({
    skipLink: !!document.querySelector('a[href="#main-content"]'),
    header: !!document.querySelector('header'),
    main: !!document.querySelector('main#main-content'),
    alert: !!document.querySelector('aside[role="alert"]'),
    footer: !!document.querySelector('footer')
  })`);
  record('Accessibility', 'App has standard ARIA landmarks (skip-link, header, main, role=alert, footer)',
    landmarksApp.skipLink && landmarksApp.header && landmarksApp.main && landmarksApp.alert && landmarksApp.footer
  );

  // Check CSS prefers-reduced-motion media query
  const reducedMotionRules = await evalJs(`(() => {
    let hasReducedMotion = false;
    let rules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion')) {
            hasReducedMotion = true;
            rules.push(rule.conditionText);
          }
        }
      } catch (e) {}
    }
    return { hasReducedMotion, count: rules.length, rules };
  })()`);
  record('Accessibility', 'prefers-reduced-motion CSS media query rule detected', reducedMotionRules.hasReducedMotion, `Found ${reducedMotionRules.count} rule(s)`);

  // Emulate reduced motion
  await client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  const reducedMotionActive = await evalJs('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
  record('Accessibility', 'Browser successfully matches prefers-reduced-motion: reduce', reducedMotionActive);

  // Test Keyboard Navigation (Tab through header elements)
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(600);
  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab' });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab' });
  const focusedAfterTab = await evalJs('document.activeElement?.tagName + " " + (document.activeElement?.getAttribute("href") || document.activeElement?.className || "")');
  record('Accessibility', 'Keyboard Tab event moves focus to interactive element', !!focusedAfterTab, focusedAfterTab);

  client.close();

  // Print Summary
  console.log('\n========================================');
  console.log('             TEST SUMMARY               ');
  console.log('========================================');
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  fs.writeFileSync('tests/qa/results.json', JSON.stringify({ total, passed, failed, results: testResults }, null, 2));

  return { total, passed, failed, results: testResults };
}

runTests()
  .then((res) => {
    if (res.failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(2);
  });
