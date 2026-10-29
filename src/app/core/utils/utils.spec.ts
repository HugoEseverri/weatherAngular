import { formatTime, parseLocal } from './time';
import { aqiLevel, describeCode, uvLevel, windDirectionLabel } from './weather-codes';

describe('weather-codes', () => {
  it('describe los códigos WMO en español', () => {
    expect(describeCode(0)).toEqual({ label: 'Despejado', kind: 'clear' });
    expect(describeCode(95).kind).toBe('thunder');
    expect(describeCode(12345).label).toBe('Desconocido');
  });

  it('traduce grados a puntos cardinales', () => {
    expect(windDirectionLabel(0)).toBe('N');
    expect(windDirectionLabel(134)).toBe('SE');
    expect(windDirectionLabel(270)).toBe('O');
    expect(windDirectionLabel(359)).toBe('N');
  });

  it('clasifica UV y calidad del aire', () => {
    expect(uvLevel(1).label).toBe('Bajo');
    expect(uvLevel(9).label).toBe('Muy alto');
    expect(aqiLevel(15).label).toBe('Excelente');
    expect(aqiLevel(120).tone).toBe('severe');
  });
});

describe('time', () => {
  it('interpreta un horario local con su offset', () => {
    const d = parseLocal('2026-10-29T09:30', -10800);
    expect(d.toISOString()).toBe('2026-10-29T12:30:00.000Z');
  });

  it('formatea la hora en la zona horaria de la ciudad', () => {
    const d = new Date('2026-10-29T12:30:00Z');
    expect(formatTime(d, 'America/Argentina/Buenos_Aires')).toBe('09:30');
    expect(formatTime(d, 'Europe/Madrid')).toBe('13:30');
  });
});
