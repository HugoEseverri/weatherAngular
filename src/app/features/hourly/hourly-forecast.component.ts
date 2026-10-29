import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { WeatherReport } from '../../core/models/weather.models';
import { UnitsService } from '../../core/services/units.service';
import { formatHour } from '../../core/utils/time';
import { IconComponent } from '../../shared/icon/icon.component';
import { WeatherIconComponent } from '../../shared/weather-icon/weather-icon.component';

const COL = 68;
const CHART_H = 84;
const PAD_TOP = 26;
const PAD_BOTTOM = 8;

export type HourlyView = 'temp' | 'rain' | 'wind';

interface Point {
  x: number;
  y: number;
  label: string;
  /** Altura de la barra (solo vista de lluvia). */
  bar: number;
}

@Component({
  selector: 'app-hourly-forecast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, WeatherIconComponent],
  templateUrl: './hourly-forecast.component.html',
  styleUrl: './hourly-forecast.component.scss',
})
export class HourlyForecastComponent {
  protected readonly units = inject(UnitsService);
  protected readonly i18n = inject(I18nService);
  readonly report = input.required<WeatherReport>();

  protected readonly view = signal<HourlyView>('temp');
  protected readonly views: HourlyView[] = ['temp', 'rain', 'wind'];
  protected readonly col = COL;
  protected readonly chartHeight = CHART_H;

  protected readonly hours = computed(() => {
    const r = this.report();
    return r.hourly.map((h, i) => ({
      ...h,
      label: i === 0 ? this.i18n.t('hourly.now') : formatHour(h.time, r.timezone, this.i18n.locale()),
    }));
  });

  protected readonly width = computed(() => this.hours().length * COL);

  /** Puntos del gráfico según la variable elegida, normalizados al alto disponible. */
  protected readonly points = computed<Point[]>(() => {
    const hours = this.hours();
    const view = this.view();
    const usable = CHART_H - PAD_TOP - PAD_BOTTOM;

    if (view === 'rain') {
      // Escala mínima de 2 mm para que lloviznas no parezcan diluvios
      const max = Math.max(2, ...hours.map((h) => h.precipitation));
      return hours.map((h, i) => {
        const bar = (h.precipitation / max) * usable;
        return {
          x: i * COL + COL / 2,
          y: CHART_H - PAD_BOTTOM - bar,
          bar,
          label: h.precipitation > 0 ? this.units.precipitationValue(h.precipitation) : '',
        };
      });
    }

    const values = hours.map((h) => (view === 'temp' ? h.temperature : h.windSpeed));
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    return values.map((v, i) => ({
      x: i * COL + COL / 2,
      y: PAD_TOP + (1 - (v - min) / span) * usable,
      bar: 0,
      label: view === 'temp' ? this.units.temp(v) : String(this.units.speedParts(v).value),
    }));
  });

  protected readonly linePath = computed(() => smoothPath(this.points()));
  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    return `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${CHART_H} L ${pts[0].x} ${CHART_H} Z`;
  });

  protected readonly unitLabel = computed(() => {
    switch (this.view()) {
      case 'rain':
        return this.units.precipitationUnit();
      case 'wind':
        return this.units.speedParts(0).unit;
      default:
        return this.units.tempUnit();
    }
  });

  protected viewLabel(view: HourlyView): string {
    return this.i18n.t(view === 'temp' ? 'hourly.temp' : view === 'rain' ? 'hourly.rain' : 'hourly.wind');
  }
}

/** Curva suave (Catmull-Rom convertida a Bézier cúbica) que pasa por todos los puntos. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y.toFixed(1)}`;
  }
  return d;
}
