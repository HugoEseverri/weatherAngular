import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { WeatherReport } from '../../core/models/weather.models';
import { UnitsService } from '../../core/services/units.service';
import { formatTime } from '../../core/utils/time';
import { aqiLevel, uvLevel, windDirectionLabel } from '../../core/utils/weather-codes';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '../../shared/icon/icon.component';

// Arco solar: semicircunferencia de radio R centrada en (CX, CY) dentro de un viewBox 200×110.
const R = 80;
const CX = 100;
const CY = 96;

@Component({
  selector: 'app-weather-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, IconComponent],
  templateUrl: './weather-details.component.html',
  styleUrl: './weather-details.component.scss',
})
export class WeatherDetailsComponent {
  protected readonly units = inject(UnitsService);
  readonly report = input.required<WeatherReport>();

  protected readonly c = computed(() => this.report().current);
  protected readonly today = computed(() => this.report().daily[0]);

  // ---- Calidad del aire ----
  protected readonly air = computed(() => {
    const aq = this.report().airQuality;
    if (!aq) return null;
    return { ...aq, level: aqiLevel(aq.aqi), pos: Math.min(aq.aqi, 100) };
  });

  // ---- UV ----
  protected readonly uv = computed(() => {
    const value = this.c().uvIndex;
    const level = uvLevel(value);
    const advice =
      value < 3
        ? 'No se requiere protección.'
        : value < 6
          ? 'Usá protector solar al mediodía.'
          : 'Evitá el sol entre las 11 y las 16 h.';
    return { value: Math.round(value), level, advice, pos: Math.min(value / 11, 1) * 100 };
  });

  // ---- Viento ----
  protected readonly wind = computed(() => {
    const c = this.c();
    return {
      ...this.units.speedParts(c.windSpeed),
      gusts: this.units.speed(c.windGusts),
      from: windDirectionLabel(c.windDirection),
      // La flecha apunta hacia donde sopla el viento
      rotation: (c.windDirection + 180) % 360,
    };
  });

  // ---- Sol ----
  protected readonly sun = computed(() => {
    const r = this.report();
    const { sunrise, sunset } = r.daily[0];
    const now = r.current.time.getTime();
    const total = sunset.getTime() - sunrise.getTime();
    const progress = Math.min(Math.max((now - sunrise.getTime()) / total, 0), 1);
    const angle = Math.PI * (1 - progress);
    const hours = Math.floor(total / 3_600_000);
    const minutes = Math.round((total % 3_600_000) / 60_000);
    const up = now >= sunrise.getTime() && now <= sunset.getTime();

    return {
      sunrise: formatTime(sunrise, r.timezone),
      sunset: formatTime(sunset, r.timezone),
      daylight: `${hours} h ${minutes} min`,
      up,
      x: CX + R * Math.cos(angle),
      y: CY - R * Math.sin(angle),
      // Longitud del arco recorrido (para pintar la parte "ya transcurrida")
      dash: Math.PI * R * progress,
      arcLength: Math.PI * R,
    };
  });
  protected readonly arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  // ---- Sensación térmica ----
  protected readonly feels = computed(() => {
    const c = this.c();
    const diff = c.feelsLike - c.temperature;
    let note = 'Similar a la temperatura real.';
    if (diff <= -2) note = c.windSpeed > 15 ? 'El viento hace que se sienta más fresco.' : 'Se siente más fresco que la temperatura real.';
    else if (diff >= 2) note = c.humidity > 60 ? 'La humedad hace que se sienta más cálido.' : 'Se siente más cálido que la temperatura real.';
    return { value: this.units.temp(c.feelsLike), note };
  });

  // ---- Visibilidad ----
  protected readonly visibility = computed(() => {
    const m = this.c().visibility;
    const note =
      m >= 20000 ? 'Visibilidad excelente.' : m >= 10000 ? 'Buena visibilidad.' : m >= 4000 ? 'Visibilidad moderada.' : 'Visibilidad reducida.';
    return { ...this.units.distance(m), note };
  });

  // ---- Presión ----
  protected readonly pressure = computed(() => {
    const hpa = this.c().pressure;
    // Rango típico 970–1050 hPa mapeado a un arco de -120° a 120°
    const ratio = Math.min(Math.max((hpa - 970) / 80, 0), 1);
    const note = hpa < 1000 ? 'Baja: posible inestabilidad.' : hpa > 1022 ? 'Alta: tiempo estable.' : 'Normal.';
    return { ...this.units.pressure(hpa), rotation: -120 + ratio * 240, note };
  });

  // ---- Precipitación ----
  protected readonly rain = computed(() => {
    const r = this.report();
    const next = r.hourly.slice(0, 24);
    const peak = next.reduce((a, h) => (h.precipitationProbability > a.precipitationProbability ? h : a), next[0]);
    return {
      today: this.units.precipitation(r.daily[0].precipitationSum),
      peak: peak?.precipitationProbability ?? 0,
      peakAt: peak ? formatTime(peak.time, r.timezone) : '',
    };
  });
}
