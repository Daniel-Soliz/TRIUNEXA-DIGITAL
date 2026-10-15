import { expect, test } from '@playwright/test';

const demos = [
  {
    key: 'barbearia-premium',
    brand: 'North Crown Barbearia — DEMO FICTÍCIA',
    targetLabel: 'Serviços',
    targetPage: 'services',
    homeHero: 'fullscreen',
  },
  {
    key: 'construtora',
    brand: 'Axis Engenharia — DEMO FICTÍCIA',
    targetLabel: 'Projetos',
    targetPage: 'projects',
    homeHero: 'editorial',
  },
  {
    key: 'clinica-odontologica',
    brand: 'Clínica Oris — DEMO FICTÍCIA',
    targetLabel: 'Tratamentos',
    targetPage: 'services',
    homeHero: 'asymmetric',
  },
] as const;

const widths = [375, 768, 1440] as const;

for (const demo of demos) {
  for (const width of widths) {
    test(`${demo.key} funciona em ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : width === 768 ? 1024 : 960 });
      await page.goto(`/?reference=${demo.key}`);

      await expect(page.getByText(demo.brand).first()).toBeVisible();
      await expect(page.locator('[data-site-page="home"]')).toBeVisible();

      const hero = page.locator('[data-site-block-type="hero"]').first();
      await expect(hero).toHaveAttribute('data-site-block-variant', demo.homeHero);

      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(overflow.width).toBeLessThanOrEqual(overflow.viewport + 2);

      await page.waitForTimeout(350);
      await page.screenshot({
        path: testInfo.outputPath(`${demo.key}-${width}.png`),
        fullPage: true,
      });

      const navButton = page
        .locator('header button:visible')
        .filter({ hasText: demo.targetLabel })
        .first();

      await expect(navButton).toBeVisible();
      await navButton.click();

      await expect(page.locator(`[data-site-page="${demo.targetPage}"]`)).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`[?&]page=${demo.targetPage}(?:&|$)`));

      await page.goBack();
      await expect(page.locator('[data-site-page="home"]')).toBeVisible();
      await page.waitForTimeout(300);
    });
  }
}

test('as três referências usam composições diferentes', async ({ page }) => {
  const signatures: string[] = [];

  for (const demo of demos) {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(`/?reference=${demo.key}`);
    await expect(page.locator('[data-site-page="home"]')).toBeVisible();

    const signature = await page.locator('[data-site-page="home"] [data-site-block-type]').evaluateAll(
      (nodes) =>
        nodes
          .map(
            (node) =>
              `${node.getAttribute('data-site-block-type')}:${node.getAttribute(
                'data-site-block-variant'
              )}`
          )
          .join('|')
    );

    signatures.push(signature);
  }

  expect(new Set(signatures).size).toBe(3);
});

test('todos os links de referência permanecem explicitamente fictícios', async ({ page }) => {
  for (const demo of demos) {
    await page.goto(`/?reference=${demo.key}`);
    await expect(page.getByText(/DEMO FICTÍCIA/i).first()).toBeVisible();
    await expect(page.getByText(/DEMONSTRAÇÃO FICTÍCIA TRUINEXA/i)).toBeVisible();
  }
});
