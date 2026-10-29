import { expect, test } from '@playwright/test';
import { CURRENT_TEMP, mockApis } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

const temperature = (page: import('@playwright/test').Page) => page.locator('app-current-weather .temp .value');

test('la portada lleva a la ciudad por defecto con su URL propia', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/clima\/buenos-aires-3435910$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Buenos Aires');
  await expect(temperature(page)).toHaveText(String(CURRENT_TEMP));
  await expect(page).toHaveTitle(/Clima en Buenos Aires: 22°/);
});

test('busca una ciudad con autocompletado y la elige con el teclado', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Buscar ciudad' });

  await search.fill('olav');
  await expect(page.getByRole('option', { name: /Olavarría/ })).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');

  await expect(page).toHaveURL(/\/clima\/olavarria-3842670$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Olavarría');
});

test('abre directamente la URL de una ciudad', async ({ page }) => {
  await page.goto('/clima/madrid-3117735');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Madrid');
});

test('muestra un error amigable si la ciudad no existe', async ({ page }) => {
  await page.goto('/clima/inexistente-999');
  await expect(page.getByRole('alert')).toContainText('No encontramos esa ciudad');
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('cambia entre °C y °F', async ({ page }) => {
  await page.goto('/clima/madrid-3117735');
  await expect(temperature(page)).toHaveText('22');

  await page.getByRole('radio', { name: '°F', exact: true }).click();
  await expect(temperature(page)).toHaveText('72');

  // La preferencia se recuerda al recargar
  await page.reload();
  await expect(temperature(page)).toHaveText('72');
});

test('traduce la interfaz al inglés', async ({ page }) => {
  await page.goto('/clima/madrid-3117735');
  await page.getByRole('radio', { name: 'EN', exact: true }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Next 24 hours' })).toBeVisible();
  await expect(page).toHaveTitle(/Weather in Madrid/);
});

test('cambia el gráfico por hora a lluvia y viento', async ({ page }) => {
  await page.goto('/clima/madrid-3117735');
  const hourly = page.locator('app-hourly-forecast');

  await hourly.getByRole('radio', { name: 'Lluvia' }).click();
  await expect(hourly.locator('rect.bar').first()).toBeVisible();

  await hourly.getByRole('radio', { name: 'Viento' }).click();
  await expect(hourly.locator('.extra.wind').first()).toBeVisible();
});

test('guarda favoritos y los muestra en "Tus ciudades"', async ({ page }) => {
  await page.goto('/clima/madrid-3117735');
  await page.getByRole('button', { name: 'Agregar a favoritos' }).click();
  await expect(page.getByRole('button', { name: 'Quitar de favoritos' })).toBeVisible();

  await page.goto('/clima/olavarria-3842670');
  // La sección se carga en diferido al llegar a la pantalla
  await page.locator('.compare').scrollIntoViewIfNeeded();
  const compare = page.locator('app-city-compare');
  await expect(compare.getByRole('link', { name: /Madrid/ })).toBeVisible();

  await compare.getByRole('link', { name: /Madrid/ }).click();
  await expect(page).toHaveURL(/\/clima\/madrid-3117735$/);
});

test('el radar de lluvia se carga al llegar a él', async ({ page }) => {
  await page.goto('/clima/madrid-3117735');
  await page.locator('.radar').scrollIntoViewIfNeeded();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.getByRole('button', { name: /animación/ })).toBeVisible();
});

test('no hay desplazamiento horizontal en el celular', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/clima/madrid-3117735');
  await expect(temperature(page)).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
