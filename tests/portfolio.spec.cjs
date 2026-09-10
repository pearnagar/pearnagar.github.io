const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const caseStudies = [
  ['/case-studies/cs2-analytics.html', 'CS2 Analytics Engine'],
  ['/case-studies/saas-platform.html', 'Acme SaaS Platform'],
  ['/case-studies/epl-moneyball.html', 'EPL Moneyball AI']
];

test('homepage exposes recruiter-critical actions', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Peer Nagar/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Reliable systems');
  await expect(page.getByRole('link', { name: /LinkedIn/ }).first()).toHaveAttribute('href', 'https://www.linkedin.com/in/peer-nagar');
  await expect(page.getByRole('link', { name: /Download CV/ }).first()).toHaveAttribute('href', './assets/Peer_Nagar_CV.pdf');
  await expect(page.getByRole('link', { name: /Email me/ })).toHaveAttribute('href', /mail\.google\.com/);
});

test('CV asset is publicly retrievable', async ({ request }) => {
  const response = await request.get('/assets/Peer_Nagar_CV.pdf');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect((await response.body()).length).toBeGreaterThan(1000);
});

test('featured projects link to case studies', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('link', { name: /Read case study/ });
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute('href', './case-studies/cs2-analytics.html');
  await expect(links.nth(1)).toHaveAttribute('href', './case-studies/saas-platform.html');
  await expect(links.nth(2)).toHaveAttribute('href', './case-studies/epl-moneyball.html');
});

for (const [path, title] of caseStudies) {
  test(`${title} case study renders`, async ({ page }) => {
    const failed = [];
    page.on('requestfailed', request => failed.push(request.url()));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('.architecture svg')).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to portfolio/ })).toHaveAttribute('href', '../index.html#projects');
    expect(failed).toEqual([]);
  });
}

test('all same-origin homepage links resolve', async ({ page, request }) => {
  await page.goto('/');
  const origin = new URL(page.url()).origin;
  const hrefs = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.href));
  const urls = [...new Set(
    hrefs
      .map(href => new URL(href))
      .filter(url => url.origin === origin && !url.hash)
      .map(url => url.href)
  )];
  for (const url of urls) {
    const response = await request.get(url);
    expect(response.status(), url).toBeLessThan(400);
  }
});

test('mobile navigation opens, closes, and keeps usable targets', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /Open navigation/ });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const box = await toggle.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('homepage has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('case studies have no horizontal page overflow', async ({ page }) => {
  for (const [path] of caseStudies) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('copy email provides accessible feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toContainText(/Email copied|Email:/);
});

test('homepage has no serious axe violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test('case studies have no serious axe violations', async ({ page }) => {
  for (const [path] of caseStudies) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(serious, `${path}\n${JSON.stringify(serious, null, 2)}`).toEqual([]);
  }
});
