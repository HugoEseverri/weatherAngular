import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { WeatherReport } from '../../core/models/weather.models';
import { UnitsService } from '../../core/services/units.service';
import { formatTime, formatWeekday } from '../../core/utils/time';
import { describeCode, uvLevel } from '../../core/utils/weather-codes';
import { IconComponent } from '../../shared/icon/icon.component';
import { WeatherIconComponent } from '../../shared/weather-icon/weather-icon.component';

/** Escala de color por temperatura (°C) para las barras de rango. */
const TEMP_STOPS: [number, string][] = [
  [-10, '#a5b4fc'],
  [0, '#93c5fd'],
  [10, '#5eead4'],
  [18, '#86efac'],
  [24, '#fde047'],
  [30, '#fb923c'],
  [38, '#ef4444'],
];

export function tempColor(t: number): string {
  if (t <= TEMP_STOPS[0][0]) return TEMP_STOPS[0][1];
  for (let i = 1; i < TEMP_STOPS.length; i++) {
    const [t1, c1] = TEMP_STOPS[i];
    if (t <= t1) {
      const [t0, c0] = TEMP_STOPS[i - 1];
      return mix(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return TEMP_STOPS[TEMP_STOPS.length - 1][1];
}

function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(', ')})`;
}

@Component({
  selector: 'app-daily-forecast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, WeatherIconComponent],
  templateUrl: './daily-forecast.component.html',
  styleUrl: './daily-forecast.component.scss',
})
export class DailyForecastComponent {
  protected readonly units = inject(UnitsService);
  protected readonly i18n = inject(I18nService);
  readonly report = input.required<WeatherReport>();

  protected readonly expanded = signal<number | null>(null);

  protected readonly days = computed(() => {
    const r = this.report();
    const lo = Math.min(...r.daily.map((d) => d.min));
    const hi = Math.max(...r.daily.map((d) => d.max));
    const span = hi - lo || 1;

    return r.daily.map((d, i) => ({
      ...d,
      label: i === 0 ? this.i18n.t('daily.today') : formatWeekday(d.date, r.timezone, this.i18n.locale()),
      condition: this.i18n.t(describeCode(d.code).key),
      left: ((d.min - lo) / span) * 100,
      width: Math.max(((d.max - d.min) / span) * 100, 4),
      gradient: `linear-gradient(90deg, ${tempColor(d.min)}, ${tempColor(d.max)})`,
      // Posición de la temperatura actual dentro de la barra de hoy
      nowPos: i === 0 ? clamp(((r.current.temperature - d.min) / (d.max - d.min || 1)) * 100, 0, 100) : null,
      sunrise: formatTime(d.sunrise, r.timezone, this.i18n.locale()),
      sunset: formatTime(d.sunset, r.timezone, this.i18n.locale()),
      uvLabel: this.i18n.t(uvLevel(d.uvIndexMax).key),
      uvRounded: Math.round(d.uvIndexMax),
    }));
  });

  protected toggle(i: number): void {
    this.expanded.update((current) => (current === i ? null : i));
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
