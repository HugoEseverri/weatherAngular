import { TranslationKey } from '../i18n/es';

const SYNODIC_MONTH = 29.530588853; // días
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // luna nueva conocida

export interface MoonInfo {
  /** Fracción del ciclo lunar: 0 = nueva, 0.5 = llena. */
  phase: number;
  /** Porcentaje iluminado (0–100). */
  illumination: number;
  key: TranslationKey;
  daysToFull: number;
}

export function moonInfo(date: Date): MoonInfo {
  const days = (date.getTime() - REFERENCE_NEW_MOON) / 86_400_000;
  const phase = (((days / SYNODIC_MONTH) % 1) + 1) % 1;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);
  const daysToFull = Math.round((((0.5 - phase) % 1) + 1) % 1 * SYNODIC_MONTH) % Math.round(SYNODIC_MONTH);

  return { phase, illumination, key: phaseKey(phase), daysToFull };
}

function phaseKey(p: number): TranslationKey {
  if (p < 0.0339 || p >= 0.9661) return 'moon.new';
  if (p < 0.216) return 'moon.waxingCrescent';
  if (p < 0.284) return 'moon.firstQuarter';
  if (p < 0.466) return 'moon.waxingGibbous';
  if (p < 0.534) return 'moon.full';
  if (p < 0.716) return 'moon.waningGibbous';
  if (p < 0.784) return 'moon.lastQuarter';
  return 'moon.waningCrescent';
}

/**
 * Trazo SVG de la parte iluminada de la luna (vista desde el hemisferio norte)
 * para un círculo de radio `r` centrado en (`c`, `c`).
 */
export function moonLitPath(phase: number, c: number, r: number): string {
  const waxing = phase < 0.5;
  const rx = Math.abs(Math.cos(2 * Math.PI * phase)) * r;
  const lessThanHalf = phase < 0.25 || phase > 0.75;
  const top = `${c} ${c - r}`;
  const bottom = `${c} ${c + r}`;

  // Borde exterior: semicírculo derecho (creciente) o izquierdo (menguante)
  const outer = `A ${r} ${r} 0 0 ${waxing ? 1 : 0} ${bottom}`;
  // Terminador: elipse que vuelve hacia arriba, curvándose según la fase
  const sweep = waxing ? (lessThanHalf ? 0 : 1) : lessThanHalf ? 1 : 0;
  const terminator = `A ${rx.toFixed(2)} ${r} 0 0 ${sweep} ${top}`;

  return `M ${top} ${outer} ${terminator} Z`;
}
