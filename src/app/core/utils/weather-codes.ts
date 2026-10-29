import { TranslationKey } from '../i18n/es';
import { ConditionKind } from '../models/weather.models';

interface CodeInfo {
  key: TranslationKey;
  kind: ConditionKind;
}

/** Tipo visual de cada código WMO usado por Open-Meteo (el texto vive en los diccionarios). */
const WMO_KINDS: Record<number, ConditionKind> = {
  0: 'clear',
  1: 'clear',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  85: 'snow',
  86: 'snow',
  95: 'thunder',
  96: 'thunder',
  99: 'thunder',
};

export function describeCode(code: number): CodeInfo {
  const kind = WMO_KINDS[code];
  return kind
    ? { key: `code.${code}` as TranslationKey, kind }
    : { key: 'code.unknown', kind: 'cloudy' };
}

/** Índice (0–7) del punto cardinal más cercano: N, NE, E, SE, S, SO, O, NO. */
export function windDirectionIndex(deg: number): number {
  return Math.round((((deg % 360) + 360) % 360) / 45) % 8;
}

export function uvLevel(uv: number): { key: TranslationKey; tone: string } {
  if (uv < 3) return { key: 'uv.low', tone: 'good' };
  if (uv < 6) return { key: 'uv.moderate', tone: 'fair' };
  if (uv < 8) return { key: 'uv.high', tone: 'poor' };
  if (uv < 11) return { key: 'uv.veryHigh', tone: 'bad' };
  return { key: 'uv.extreme', tone: 'severe' };
}

export function aqiLevel(aqi: number): { key: TranslationKey; advice: TranslationKey; tone: string } {
  if (aqi <= 20) return { key: 'aq.excellent', advice: 'aq.adviceExcellent', tone: 'good' };
  if (aqi <= 40) return { key: 'aq.good', advice: 'aq.adviceGood', tone: 'good' };
  if (aqi <= 60) return { key: 'aq.moderate', advice: 'aq.adviceModerate', tone: 'fair' };
  if (aqi <= 80) return { key: 'aq.poor', advice: 'aq.advicePoor', tone: 'poor' };
  if (aqi <= 100) return { key: 'aq.veryPoor', advice: 'aq.adviceVeryPoor', tone: 'bad' };
  return { key: 'aq.extreme', advice: 'aq.adviceExtreme', tone: 'severe' };
}
