import { Page } from '@playwright/test';

/**
 * Respuestas simuladas de las APIs externas para que los tests e2e sean
 * deterministas y no dependan de la red ni del clima real.
 */

export const CITIES = {
  olavarria: {
    id: 3842670,
    name: 'Olavarría',
    latitude: -36.89384,
    longitude: -60.32319,
    country: 'Argentina',
    country_code: 'AR',
    admin1: 'Buenos Aires',
  },
  madrid: {
    id: 3117735,
    name: 'Madrid',
    latitude: 40.4165,
    longitude: -3.70256,
    country: 'España',
    country_code: 'ES',
    admin1: 'Comunidad de Madrid',
  },
  buenosAires: {
    id: 3435910,
    name: 'Buenos Aires',
    latitude: -34.61315,
    longitude: -58.37723,
    country: 'Argentina',
    country_code: 'AR',
    admin1: 'Ciudad Autónoma de Buenos Aires',
  },
};

/** Temperatura actual simulada: 22 °C (71.6 °F → se muestra 72°). */
export const CURRENT_TEMP = 22;

const pad = (n: number) => String(n).padStart(2, '0');
const isoHour = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
const isoDay = (d: Date) => isoHour(d).slice(0, 10);

function forecast() {
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  const hours = Array.from({ length: 25 }, (_, i) => new Date(now.getTime() + i * 3_600_000));
  const days = Array.from({ length: 10 }, (_, i) => new Date(now.getTime() + i * 86_400_000));

  return {
    timezone: 'UTC',
    utc_offset_seconds: 0,
    current: {
      time: isoHour(now),
      temperature_2m: CURRENT_TEMP,
      relative_humidity_2m: 60,
      apparent_temperature: 21,
      is_day: 1,
      precipitation: 0,
      weather_code: 1,
      cloud_cover: 20,
      pressure_msl: 1015,
      wind_speed_10m: 12,
      wind_direction_10m: 90,
      wind_gusts_10m: 25,
      dew_point_2m: 12,
      visibility: 30000,
      uv_index: 4,
    },
    hourly: {
      time: hours.map(isoHour),
      temperature_2m: hours.map((_, i) => CURRENT_TEMP + Math.round(Math.sin(i / 4) * 4)),
      weather_code: hours.map((_, i) => (i > 6 && i < 10 ? 61 : 2)),
      precipitation_probability: hours.map((_, i) => (i > 6 && i < 10 ? 70 : 5)),
      precipitation: hours.map((_, i) => (i > 6 && i < 10 ? 1.2 : 0)),
      is_day: hours.map((h) => (h.getUTCHours() >= 8 && h.getUTCHours() < 20 ? 1 : 0)),
      wind_speed_10m: hours.map((_, i) => 10 + (i % 5)),
      wind_direction_10m: hours.map(() => 90),
    },
    daily: {
      time: days.map(isoDay),
      weather_code: days.map((_, i) => [1, 2, 3, 61, 95, 2, 1, 3, 71, 0][i]),
      temperature_2m_max: days.map((_, i) => 25 + (i % 3)),
      temperature_2m_min: days.map((_, i) => 12 + (i % 2)),
      sunrise: days.map((d) => `${isoDay(d)}T06:00`),
      sunset: days.map((d) => `${isoDay(d)}T19:30`),
      uv_index_max: days.map(() => 7),
      precipitation_sum: days.map((_, i) => (i === 3 ? 8 : 0)),
      precipitation_probability_max: days.map((_, i) => (i === 3 ? 80 : 10)),
      wind_speed_10m_max: days.map(() => 20),
    },
  };
}

function summary() {
  return {
    timezone: 'UTC',
    current: { temperature_2m: CURRENT_TEMP, weather_code: 1, is_day: 1 },
    daily: { temperature_2m_max: [26], temperature_2m_min: [12] },
  };
}

// PNG transparente de 1×1 para mapas y banderas
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export async function mockApis(page: Page): Promise<void> {
  const all = Object.values(CITIES);

  await page.route('https://geocoding-api.open-meteo.com/v1/search**', (route) => {
    const name = new URL(route.request().url()).searchParams.get('name')?.toLowerCase() ?? '';
    const results = all.filter((c) =>
      c.name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .startsWith(name),
    );
    return route.fulfill({ json: { results } });
  });

  await page.route('https://geocoding-api.open-meteo.com/v1/get**', (route) => {
    const id = Number(new URL(route.request().url()).searchParams.get('id'));
    const city = all.find((c) => c.id === id);
    return city ? route.fulfill({ json: city }) : route.fulfill({ status: 404, json: { error: true } });
  });

  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    const lat = new URL(route.request().url()).searchParams.get('latitude') ?? '';
    // Varias coordenadas = resumen para el comparador de ciudades
    if (lat.includes(',')) return route.fulfill({ json: lat.split(',').map(() => summary()) });
    if (new URL(route.request().url()).searchParams.get('daily')?.startsWith('temperature')) {
      return route.fulfill({ json: summary() });
    }
    return route.fulfill({ json: forecast() });
  });

  await page.route('https://air-quality-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { current: { european_aqi: 18, pm2_5: 4, pm10: 6, ozone: 50, nitrogen_dioxide: 3 } } }),
  );

  await page.route('https://api.bigdatacloud.net/**', (route) =>
    route.fulfill({ json: { locality: 'Olavarría', countryName: 'Argentina', countryCode: 'AR' } }),
  );

  await page.route('https://api.rainviewer.com/**', (route) =>
    route.fulfill({
      json: {
        host: 'https://tilecache.rainviewer.com',
        radar: { past: [{ time: Math.floor(Date.now() / 1000) - 600, path: '/v2/radar/test' }] },
      },
    }),
  );

  for (const pattern of ['https://tilecache.rainviewer.com/**', 'https://server.arcgisonline.com/**', 'https://flagcdn.com/**']) {
    await page.route(pattern, (route) => route.fulfill({ body: PIXEL, contentType: 'image/png' }));
  }

  // Las fuentes no hacen falta en los tests
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ body: '', contentType: 'text/css' }));
}
