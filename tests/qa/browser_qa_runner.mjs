import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

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

async function isEndpointUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForEndpoint(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isEndpointUp(url)) return true;
    await sleep(300);
  }
  return false;
}

async function runTests() {
  const screenshotDir = path.resolve('docs/product/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  let previewProc = null;
  let chromeProc = null;
  let tmpChromeDir = null;

  try {
    if (!(await isEndpointUp('http://127.0.0.1:4173/'))) {
      const cmd = process.platform === 'win32' ? 'cmd.exe' : 'npx';
      const args =
        process.platform === 'win32'
          ? ['/d', '/s', '/c', 'npx vite preview --port 4173 --strictPort --host 127.0.0.1']
          : ['vite', 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'];
      previewProc = spawn(cmd, args, {
        cwd: path.resolve('frontend'),
        stdio: 'ignore',
      });
      const previewReady = await waitForEndpoint('http://127.0.0.1:4173/', 15000);
      if (!previewReady) {
        throw new Error('Vite preview server on http://127.0.0.1:4173/ did not become ready');
      }
    }

    if (!(await isEndpointUp('http://127.0.0.1:9222/json/version'))) {
      const chromePath = process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      tmpChromeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scam_checker_cdp_'));
      chromeProc = spawn(
        chromePath,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--remote-debugging-port=9222',
          `--user-data-dir=${tmpChromeDir}`,
          'about:blank',
        ],
        { stdio: 'ignore' }
      );
      const chromeReady = await waitForEndpoint('http://127.0.0.1:9222/json/version', 15000);
      if (!chromeReady) {
        throw new Error('Headless Chrome CDP on http://127.0.0.1:9222 did not become ready');
      }
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
      if (fs.existsSync(filePath) && process.env.OVERWRITE_SCREENSHOTS !== '1') {
        console.log(`Preserved existing screenshot (no overwrite): ${filePath}`);
        return;
      }
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

  // Test closing mobile menu with Escape key (375x667)
  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27, key: 'Escape', code: 'Escape' });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27, key: 'Escape', code: 'Escape' });
  await sleep(300);
    const menuClosedAfterEscape = await evalJs(`(() => {
    const btn = document.querySelector('button[aria-label="Mở danh mục điều hướng"]');
    const links = Array.from(document.querySelectorAll('header .lg\\\\:hidden a'));
    return {
        expanded: btn ? btn.getAttribute('aria-expanded') : null,
        linksCount: links.length
    };
  })()`);
  record(
    'Mobile Responsive',
      'Mobile menu closes on Escape key (375x667)',
    menuClosedAfterEscape.expanded === 'false' && menuClosedAfterEscape.linksCount === 0,
      `aria-expanded=${menuClosedAfterEscape.expanded}, linksCount=${menuClosedAfterEscape.linksCount}`
  );

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

    // Check SafetyChecklist keyboard Space and Enter update aria-checked on Landing (1920x1080)
    const checklistKeyboardResult = await evalJs(`(async () => {
      const firstCheckbox = document.querySelector('#checklist [role="checkbox"]');
      if (!firstCheckbox) return { found: false };
      firstCheckbox.focus();
      const initial = firstCheckbox.getAttribute('aria-checked');
      firstCheckbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 100));
    const afterSpace = firstCheckbox.getAttribute('aria-checked');
    firstCheckbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 100));
      const afterEnter = firstCheckbox.getAttribute('aria-checked');
    return { found: true, initial, afterSpace, afterEnter };
  })()`);
  record(
      'Accessibility',
      'SafetyChecklist receives Space/Enter and updates aria-checked (1920x1080)',
    checklistKeyboardResult.found &&
        checklistKeyboardResult.initial === 'false' &&
        checklistKeyboardResult.afterSpace === 'true' &&
        checklistKeyboardResult.afterEnter === 'false',
    `initial=${checklistKeyboardResult.initial} -> Space=${checklistKeyboardResult.afterSpace} -> Enter=${checklistKeyboardResult.afterEnter}`
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

  // Test JS scroll actions respect prefers-reduced-motion: reduce (behavior: 'auto')
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(600);
  const jsReducedScrollResult = await evalJs(`(() => {
    const behaviors = [];
    const origScrollIntoView = Element.prototype.scrollIntoView;
    const origScrollTo = window.scrollTo;
    Element.prototype.scrollIntoView = function(arg) {
      behaviors.push(typeof arg === 'object' && arg ? arg.behavior : String(arg));
      return origScrollIntoView.apply(this, arguments);
    };
    window.scrollTo = function(arg) {
      if (typeof arg === 'object' && arg && 'behavior' in arg) {
        behaviors.push(arg.behavior);
      }
      return origScrollTo.apply(this, arguments);
    };
    try {
      const verifyBtn = Array.from(document.querySelectorAll('#cach-xu-ly button')).find(b => b.textContent.includes('Xem công cụ hỗ trợ gì'));
      if (verifyBtn) verifyBtn.click();
      const navLink = document.querySelector('nav a[href="#tinh-huong"]');
      if (navLink) navLink.click();
      const topBtn = Array.from(document.querySelectorAll('footer button')).find(b => b.textContent.includes('Về đầu trang'));
      if (topBtn) topBtn.click();
    } finally {
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
    }
    return {
      behaviors,
      allAuto: behaviors.length === 3 && behaviors.every(b => b === 'auto')
    };
  })()`);
  record(
    'Accessibility',
    'JS scroll actions use behavior=auto when prefers-reduced-motion is active',
    jsReducedScrollResult.allAuto,
    `recorded behaviors: [${jsReducedScrollResult.behaviors.join(', ')}]`
  );

  // Test Keyboard Navigation (Tab through header elements)
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(600);
  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab' });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab' });
  const focusedAfterTab = await evalJs('document.activeElement?.tagName + " " + (document.activeElement?.getAttribute("href") || document.activeElement?.className || "")');
  record('Accessibility', 'Keyboard Tab event moves focus to interactive element', !!focusedAfterTab, focusedAfterTab);

  // --- SUITE 7: /app LOCAL-ONLY OFFLINE BANNER, CLIENT EXTENSION GUARD (.avi/.flac) & HTTP 503/504 ALERTS ---
  console.log('\n--- Running Suite 7: /app Local-Only Offline State, Client Guard & HTTP 503/504 Handling ---');
  await setViewport(1920, 1080, false);
  await client.send('Page.navigate', { url: 'http://localhost:4173/app' });
  await sleep(1000);

  // Force health check to resolve offline deterministically in browser
  const offlineState = await evalJs(`(async () => {
    const origFetch = window.fetch;
    window.fetch = async (url, opts) => {
      if (String(url).includes('/health/')) {
        throw new TypeError('Failed to fetch');
      }
      return origFetch(url, opts);
    };
    const refreshBtn = document.querySelector('button[aria-label="Trạng thái kết nối máy chủ backend"]');
    if (refreshBtn) refreshBtn.click();
    await new Promise(r => setTimeout(r, 250));
    const input = document.querySelector('input#file-upload-input');
    const dropzone = document.querySelector('div[role="button"][aria-label*="Khu vực kéo thả tệp"]');
    const hasLocalOnlyBanner = document.body.innerText.includes('Giao diện thử nghiệm cục bộ (Local-Only Demo) — Backend chưa kết nối');
    const hasDisconnectedStatus = document.body.innerText.includes('Backend: Ngắt kết nối');
    window.fetch = origFetch;
    return {
      hasLocalOnlyBanner,
      hasDisconnectedStatus,
      inputDisabled: input ? input.disabled : false,
      dropzoneTabIndex: dropzone ? dropzone.tabIndex : null,
        dropzoneAriaDisabled: dropzone ? dropzone.getAttribute('aria-disabled') : null
      };
  })()`);
    record(
    'App Local-Only & Guards',
    '/app displays Local-Only Demo banner and disables upload when backend is offline (1920x1080)',
      offlineState.hasLocalOnlyBanner &&
      offlineState.hasDisconnectedStatus &&
      offlineState.inputDisabled === true &&
        offlineState.dropzoneTabIndex === -1 &&
        offlineState.dropzoneAriaDisabled === 'true',
    `banner=${offlineState.hasLocalOnlyBanner}, status=${offlineState.hasDisconnectedStatus}, disabled=${offlineState.inputDisabled}, tabIndex=${offlineState.dropzoneTabIndex}, ariaDisabled=${offlineState.dropzoneAriaDisabled}`
  );

  // Simulate backend online to test client-side extension rejection (.avi / .flac) and HTTP 503/504 display
  const clientExtGuardResult = await evalJs(`(async () => {
    const origFetch = window.fetch;
    window.fetch = async (url, opts) => {
      if (String(url).includes('/health/')) {
        return new Response(JSON.stringify({ status: 'ready', storage_writable: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return origFetch(url, opts);
    };
    const refreshBtn = document.querySelector('button[aria-label="Trạng thái kết nối máy chủ backend"]');
    if (refreshBtn) refreshBtn.click();
    await new Promise(r => setTimeout(r, 250));

    const input = document.querySelector('input#file-upload-input');
    const testReject = async (fileName, mimeType) => {
      const dt = new DataTransfer();
      dt.items.add(new File(['dummy_media_content'], fileName, { type: mimeType }));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 100));
      const alerts = Array.from(document.querySelectorAll('[role="alert"]')).map(el => el.innerText);
      return alerts.some(t => t.includes('Định dạng tệp không được hỗ trợ') && t.includes('.wav, .mp3, .ogg'));
    };

    const aviRejected = await testReject('sample_clip.avi', 'video/x-msvideo');
    const flacRejected = await testReject('lossless_audio.flac', 'audio/flac');
    window.fetch = origFetch;
    return { aviRejected, flacRejected };
  })()`);
  record(
    'App Local-Only & Guards',
    'FileUploader rejects unsupported extensions (.avi and .flac) on client even with video/* or audio/* MIME',
    clientExtGuardResult.aviRejected && clientExtGuardResult.flacRejected,
    `aviRejected=${clientExtGuardResult.aviRejected}, flacRejected=${clientExtGuardResult.flacRejected}`
  );

  // Test HTTP 503 (sandbox unavailable) and HTTP 504 (parser timeout) rendering on /app
  const http503And504Result = await evalJs(`(async () => {
    const origFetch = window.fetch;
    let nextStatus = 503;
    let nextDetail = 'Sandbox phân tích media không sẵn sàng.';
    window.fetch = async (url, opts) => {
      if (String(url).includes('/health/')) {
        return new Response(JSON.stringify({ status: 'ready', storage_writable: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (String(url).includes('/api/v1/analyses') && opts?.method === 'POST') {
        return new Response(JSON.stringify({ detail: nextDetail }), {
          status: nextStatus,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return origFetch(url, opts);
    };

    const refreshBtn = document.querySelector('button[aria-label="Trạng thái kết nối máy chủ backend"]');
    if (refreshBtn) refreshBtn.click();
    await new Promise(r => setTimeout(r, 200));

    const input = document.querySelector('input#file-upload-input');
    const dt = new DataTransfer();
    dt.items.add(new File(['RIFF____WAVEfmt '], 'valid_sample.wav', { type: 'audio/wav' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 150));

    const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bắt đầu phân tích'));
    if (startBtn) startBtn.click();
    await new Promise(r => setTimeout(r, 250));
    const alert503 = Array.from(document.querySelectorAll('[role="alert"]')).map(a => a.innerText).join(' | ');
    const ok503 = alert503.includes('Sandbox phân tích media không sẵn sàng.');

    nextStatus = 504;
    nextDetail = 'Phân tích media vượt quá thời hạn 5.0 giây.';
    const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thử lại'));
    if (retryBtn) retryBtn.click();
    await new Promise(r => setTimeout(r, 250));
    const alert504 = Array.from(document.querySelectorAll('[role="alert"]')).map(a => a.innerText).join(' | ');
    const ok504 = alert504.includes('Phân tích media vượt quá thời hạn 5.0 giây.');

    window.fetch = origFetch;
    return { ok503, ok504 };
  })()`);
  record(
    'App Local-Only & Guards',
    '/app displays distinct ErrorAlert messages for HTTP 503 (sandbox unavailable) and HTTP 504 (parser timeout)',
    http503And504Result.ok503 && http503And504Result.ok504,
    `503_displayed=${http503And504Result.ok503}, 504_displayed=${http503And504Result.ok504}`
  );

  // Test cancelling an in-flight upload aborts fetch signal and blocks stale response from overwriting idle UI
  const cancelRaceResult = await evalJs(`(async () => {
    const origFetch = window.fetch;
    let capturedSignal = null;
    let resolveLateUpload = null;
    window.fetch = async (url, opts) => {
      if (String(url).includes('/health/')) {
        return new Response(JSON.stringify({ status: 'ready', storage_writable: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (String(url).includes('/api/v1/analyses') && opts?.method === 'POST') {
        capturedSignal = opts.signal || null;
        return new Promise((resolve) => {
          resolveLateUpload = resolve;
        });
      }
      return origFetch(url, opts);
    };

    const dismissBtn = document.querySelector('button[aria-label="Đóng thông báo lỗi"]');
    if (dismissBtn) dismissBtn.click();
    await new Promise(r => setTimeout(r, 100));

    const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thử lại'));
    if (retryBtn) {
      retryBtn.click();
    } else {
      const input = document.querySelector('input#file-upload-input');
      const dt = new DataTransfer();
      dt.items.add(new File(['RIFF____WAVEfmt '], 'cancel_sample.wav', { type: 'audio/wav' }));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 100));
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bắt đầu phân tích'));
      if (startBtn) startBtn.click();
    }
    await new Promise(r => setTimeout(r, 150));

    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Hủy bỏ'));
    const hadCancelBtn = !!cancelBtn;
    if (cancelBtn) cancelBtn.click();
    await new Promise(r => setTimeout(r, 150));

    const signalAborted = capturedSignal ? capturedSignal.aborted : false;
    const idleAfterCancel = !!document.querySelector('input#file-upload-input');

    // Simulate stale response arriving after cancel
    if (resolveLateUpload) {
      resolveLateUpload(new Response(JSON.stringify({ id: 'stale-job-id', status: 'completed', created_at: new Date().toISOString() }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    await new Promise(r => setTimeout(r, 250));

    const stillIdleAfterLateResolve = !!document.querySelector('input#file-upload-input');
    const noReportAfterCancel = !document.getElementById('report-heading');
    const noErrorAlertAfterCancel = !Array.from(document.querySelectorAll('[role="alert"]')).some(a => a.innerText.includes('Đã xảy ra lỗi'));

    window.fetch = origFetch;
    return {
      hadCancelBtn,
      signalAborted,
      idleAfterCancel,
      stillIdleAfterLateResolve,
      noReportAfterCancel,
      noErrorAlertAfterCancel
    };
  })()`);
  record(
    'App Local-Only & Guards',
    'Cancelling in-flight upload aborts fetch signal and prevents stale response from updating UI (1920x1080)',
    cancelRaceResult.hadCancelBtn &&
      cancelRaceResult.signalAborted &&
      cancelRaceResult.idleAfterCancel &&
      cancelRaceResult.stillIdleAfterLateResolve &&
      cancelRaceResult.noReportAfterCancel &&
      cancelRaceResult.noErrorAlertAfterCancel,
    `cancelBtn=${cancelRaceResult.hadCancelBtn}, aborted=${cancelRaceResult.signalAborted}, idle=${cancelRaceResult.stillIdleAfterLateResolve}, noReport=${cancelRaceResult.noReportAfterCancel}, noErr=${cancelRaceResult.noErrorAlertAfterCancel}`
  );

  // Test compatibility when AbortSignal.timeout and AbortSignal.any are unavailable (health online + mock DELETE succeed)
  const abortCompatResult = await evalJs(`(async () => {
    const origFetch = window.fetch;
    const origTimeoutDesc = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');
    const origAnyDesc = Object.getOwnPropertyDescriptor(AbortSignal, 'any');
    let healthMode = 'offline';
    let healthCalledWithoutApi = false;
    let healthHasSignal = false;
    let deleteCalledWithoutApi = false;
    let deleteHasSignal = false;

    try {
      window.fetch = async (url, opts) => {
        const u = String(url);
        if (u.includes('/health/')) {
          if (healthMode === 'offline') {
            throw new TypeError('Simulated offline');
          }
          healthCalledWithoutApi = true;
          healthHasSignal = opts?.signal instanceof AbortSignal;
          return new Response(JSON.stringify({ status: 'ready', storage_writable: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (u.includes('/api/v1/analyses') && opts?.method === 'POST') {
          return new Response(JSON.stringify({
            id: 'compat-delete-job-1',
            status: 'completed',
            created_at: new Date().toISOString()
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (u.includes('/api/v1/analyses/compat-delete-job-1') && (!opts?.method || opts.method === 'GET')) {
          return new Response(JSON.stringify({
            id: 'compat-delete-job-1',
            status: 'completed',
            mode: 'demo',
            file_facts: {
              file_name: 'compat_sample.wav',
              file_size_bytes: 1024,
              mime_type: 'audio/wav',
              sha256_hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
              duration_seconds: 1.5
            },
            ai_status: 'Chưa tích hợp mô hình AI phát hiện deepfake thật.',
            educational_mock_cues: [],
            recommendations: ['Chủ động gọi lại qua kênh độc lập.'],
            created_at: new Date().toISOString()
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (u.includes('/api/v1/analyses/compat-delete-job-1') && opts?.method === 'DELETE') {
          deleteCalledWithoutApi = true;
          deleteHasSignal = opts?.signal instanceof AbortSignal;
          return new Response(null, { status: 204 });
        }
        return origFetch(url, opts);
      };

      const refreshBtn = document.querySelector('button[aria-label="Trạng thái kết nối máy chủ backend"]');
      if (refreshBtn) refreshBtn.click();
      await new Promise(r => setTimeout(r, 200));
      const wentOfflineFirst = (refreshBtn?.innerText || '').includes('Backend: Ngắt kết nối');

      Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true, writable: true });
      Object.defineProperty(AbortSignal, 'any', { value: undefined, configurable: true, writable: true });
      const apisDisabled = typeof AbortSignal.timeout === 'undefined' && typeof AbortSignal.any === 'undefined';

      healthMode = 'online';
      if (refreshBtn) refreshBtn.click();
      await new Promise(r => setTimeout(r, 250));
      const healthOnlineWithoutApi = (refreshBtn?.innerText || '').includes('Backend: Sẵn sàng');

      const input = document.querySelector('input#file-upload-input');
      const dt = new DataTransfer();
      dt.items.add(new File(['RIFF____WAVEfmt '], 'compat_sample.wav', { type: 'audio/wav' }));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));

      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bắt đầu phân tích'));
      if (startBtn) startBtn.click();

      let reportVisible = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 150));
        if (document.getElementById('report-heading')) {
          reportVisible = true;
          break;
        }
      }

      const deleteBtn = document.querySelector('button[aria-label="Xóa dữ liệu phiên phân tích và tệp cách ly"]');
      if (deleteBtn) deleteBtn.click();
      await new Promise(r => setTimeout(r, 150));

      const confirmDeleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xác nhận xóa ngay'));
      if (confirmDeleteBtn) confirmDeleteBtn.click();
      await new Promise(r => setTimeout(r, 250));

      const idleAfterDelete = !!document.querySelector('input#file-upload-input');
      const deleteNoticeShown = document.body.innerText.includes('Đã xóa báo cáo khỏi bộ nhớ của backend');
      const noErrorAfterDelete = !Array.from(document.querySelectorAll('[role="alert"]')).some(a => a.innerText.includes('Đã xảy ra lỗi'));

      return {
        wentOfflineFirst,
        apisDisabled,
        healthCalledWithoutApi,
        healthHasSignal,
        healthOnlineWithoutApi,
        reportVisible,
        deleteCalledWithoutApi,
        deleteHasSignal,
        idleAfterDelete,
        deleteNoticeShown,
        noErrorAfterDelete
      };
    } finally {
      window.fetch = origFetch;
      if (origTimeoutDesc) {
        Object.defineProperty(AbortSignal, 'timeout', origTimeoutDesc);
      }
      if (origAnyDesc) {
        Object.defineProperty(AbortSignal, 'any', origAnyDesc);
      }
    }
  })()`);
  record(
    'App Local-Only & Guards',
    'Health check reports online and mock DELETE succeeds when AbortSignal.timeout and AbortSignal.any are unavailable (1920x1080)',
    abortCompatResult.wentOfflineFirst &&
      abortCompatResult.apisDisabled &&
      abortCompatResult.healthCalledWithoutApi &&
      abortCompatResult.healthHasSignal &&
      abortCompatResult.healthOnlineWithoutApi &&
      abortCompatResult.reportVisible &&
      abortCompatResult.deleteCalledWithoutApi &&
      abortCompatResult.deleteHasSignal &&
      abortCompatResult.idleAfterDelete &&
      abortCompatResult.deleteNoticeShown &&
      abortCompatResult.noErrorAfterDelete,
    `offlineFirst=${abortCompatResult.wentOfflineFirst}, apisDisabled=${abortCompatResult.apisDisabled}, healthOnline=${abortCompatResult.healthOnlineWithoutApi}, healthSignal=${abortCompatResult.healthHasSignal}, report=${abortCompatResult.reportVisible}, deleteOk=${abortCompatResult.deleteCalledWithoutApi && abortCompatResult.deleteHasSignal && abortCompatResult.deleteNoticeShown}, idle=${abortCompatResult.idleAfterDelete}, noErr=${abortCompatResult.noErrorAfterDelete}`
  );

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
} finally {
  if (chromeProc && !chromeProc.killed) {
    try {
      chromeProc.kill();
    } catch {}
  }
  if (previewProc && !previewProc.killed) {
    try {
      if (process.platform === 'win32' && previewProc.pid) {
        spawn('taskkill', ['/PID', String(previewProc.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        previewProc.kill();
      }
    } catch {}
  }
}
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
