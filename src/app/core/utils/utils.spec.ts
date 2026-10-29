import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { moonInfo } from './moon';
import { parseSlug, placeSlug, slugify } from './slug';
import { formatHour, formatTime, parseLocal } from './time';
import { aqiLevel, describeCode, uvLevel, windDirectionIndex } from './weather-codes';

describe('weather-codes', () => {
  it('asocia cada código WMO con su clave de traducción y tipo visual', () => {
    expect(describeCode(0)).toEqual({ key: 'code.0', kind: 'clear' });
    expect(describeCode(95).kind).toBe('thunder');
    expect(describeCode(12345).key).toBe('code.unknown');
  });

  it('traduce grados al punto cardinal más cercano', () => {
    expect(windDirectionIndex(0)).toBe(0);
    expect(windDirectionIndex(134)).toBe(3);
    expect(windDirectionIndex(270)).toBe(6);
    expect(windDirectionIndex(359)).toBe(0);
  });

  it('clasifica UV y calidad del aire', () => {
    expect(uvLevel(1).key).toBe('uv.low');
    expect(uvLevel(9).key).toBe('uv.veryHigh');
    expect(aqiLevel(15).key).toBe('aq.excellent');
    expect(aqiLevel(120).tone).toBe('severe');
  });
});

describe('i18n', () => {
  it('el diccionario en inglés tiene exactamente las mismas claves que el español', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });
});

describe('time', () => {
  it('interpreta un horario local con su offset', () => {
    expect(parseLocal('2026-10-29T09:30', -10800).toISOString()).toBe('2026-10-29T12:30:00.000Z');
  });

  it('formatea la hora en la zona horaria de la ciudad y el idioma elegido', () => {
    const d = new Date('2026-10-29T12:30:00Z');
    expect(formatTime(d, 'America/Argentina/Buenos_Aires')).toBe('09:30');
    expect(formatTime(d, 'Europe/Madrid')).toBe('13:30');
    expect(formatHour(d, 'Europe/Madrid', 'es-AR')).toBe('13 h');
    expect(formatHour(d, 'Europe/Madrid', 'en-US')).toMatch(/^1\sPM$/);
  });
});

describe('slug', () => {
  it('genera URLs legibles a partir de la ciudad', () => {
    expect(slugify('Olavarría, Buenos Aires')).toBe('olavarria-buenos-aires');
    expect(placeSlug({ id: '3842670', name: 'Olavarría', latitude: 0, longitude: 0 })).toBe('olavarria-3842670');
    expect(placeSlug({ id: 'geo:x', name: '', latitude: -36.89384, longitude: -60.32319 })).toBe('@-36.8938,-60.3232');
  });

  it('interpreta los slugs de la URL', () => {
    expect(parseSlug('olavarria-3842670')).toEqual({ kind: 'id', id: '3842670' });
    expect(parseSlug('@-36.8938,-60.3232')).toEqual({ kind: 'coords', latitude: -36.8938, longitude: -60.3232 });
    expect(parseSlug('%40-36.8938%2C-60.3232')).toEqual({ kind: 'coords', latitude: -36.8938, longitude: -60.3232 });
    expect(parseSlug('cualquier-cosa')).toBeNull();
    expect(parseSlug('@95,10')).toBeNull();
  });
});

describe('moon', () => {
  it('detecta luna llena y luna nueva en fechas conocidas', () => {
    // Luna llena: 21/01/2000 04:40 UTC · luna nueva: 06/01/2000 18:14 UTC
    const full = moonInfo(new Date(Date.UTC(2000, 0, 21, 4, 40)));
    expect(full.key).toBe('moon.full');
    expect(full.illumination).toBeGreaterThan(98);

    const fresh = moonInfo(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    expect(fresh.key).toBe('moon.new');
    expect(fresh.illumination).toBe(0);
    expect(fresh.daysToFull).toBe(15);
  });
});
