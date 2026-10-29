import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { WeatherReport } from '../../core/models/weather.models';
import { UnitsService } from '../../core/services/units.service';
import { formatHour } from '../../core/utils/time';
import { IconComponent } from '../../shared/icon/icon.component';
import { WeatherIconComponent } from '../../shared/weather-icon/weather-icon.component';

const COL = 68;
const CHART_H = 76;
const PAD_TOP = 26;
const PAD_BOTTOM = 10;

@Component({
  selector: 'app-hourly-forecast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, WeatherIconComponent],
  templateUrl: './hourly-forecast.component.html',
  styleUrl: './hourly-forecast.component.scss',
})
export class HourlyForecastComponent {
  protected readonly units = inject(UnitsService);
  readonly report = input.required<WeatherReport>();

  protected readonly col = COL;
  protected readonly chartHeight = CHART_H;

  protected readonly hours = computed(() => {
    const r = this.report();
    return r.hourly.map((h, i) => ({
      ...h,
      label: i === 0 ? 'Ahora' : formatHour(h.time, r.timezone),
    }));
  });

  protected readonly width = computed(() => this.hours().length * COL);

  /** Puntos de la curva: x en el centro de cada columna, y normalizada al rango de temperaturas. */
  protected readonly points = computed(() => {
    const temps = this.hours().map((h) => h.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const span = max - min || 1;
    const usable = CHART_H - PAD_TOP - PAD_BOTTOM;
    return temps.map((t, i) => ({
      x: i * COL + COL / 2,
      y: PAD_TOP + (1 - (t - min) / span) * usable,
      t,
    }));
  });

  protected readonly linePath = computed(() => smoothPath(this.points()));
  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    return `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${CHART_H} L ${pts[0].x} ${CHART_H} Z`;
  });
}

/** Curva suave (Catmull-Rom convertida a Bézier cúbica) que pasa por todos los puntos. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
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
