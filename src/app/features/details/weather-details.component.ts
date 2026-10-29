import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { WeatherReport } from '../../core/models/weather.models';
import { UnitsService } from '../../core/services/units.service';
import { moonInfo, moonLitPath } from '../../core/utils/moon';
import { formatTime } from '../../core/utils/time';
import { aqiLevel, uvLevel, windDirectionIndex } from '../../core/utils/weather-codes';
import { IconComponent } from '../../shared/icon/icon.component';

// Arco solar: semicircunferencia de radio R centrada en (CX, CY) dentro de un viewBox 200×110.
const R = 80;
const CX = 100;
const CY = 96;

@Component({
  selector: 'app-weather-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './weather-details.component.html',
  styleUrl: './weather-details.component.scss',
})
export class WeatherDetailsComponent {
  protected readonly units = inject(UnitsService);
  protected readonly i18n = inject(I18nService);
  readonly report = input.required<WeatherReport>();

  protected readonly c = computed(() => this.report().current);

  // ---- Calidad del aire ----
  protected readonly air = computed(() => {
    const aq = this.report().airQuality;
    if (!aq) return null;
    const level = aqiLevel(aq.aqi);
    return {
      ...aq,
      tone: level.tone,
      label: this.i18n.t(level.key),
      advice: this.i18n.t(level.advice),
      pos: Math.min(aq.aqi, 100),
      values: [
        { name: 'PM2.5', value: this.i18n.number(aq.pm25) },
        { name: 'PM10', value: this.i18n.number(aq.pm10) },
        { name: 'O₃', value: this.i18n.number(aq.ozone, 0) },
        { name: 'NO₂', value: this.i18n.number(aq.nitrogenDioxide) },
      ],
    };
  });

  // ---- UV ----
  protected readonly uv = computed(() => {
    const value = this.c().uvIndex;
    const level = uvLevel(value);
    const advice = value < 3 ? 'uv.adviceLow' : value < 6 ? 'uv.adviceMid' : 'uv.adviceHigh';
    return {
      value: Math.round(value),
      tone: level.tone,
      label: this.i18n.t(level.key),
      advice: this.i18n.t(advice),
      pos: Math.min(value / 11, 1) * 100,
    };
  });

  // ---- Viento ----
  protected readonly wind = computed(() => {
    const c = this.c();
    return {
      ...this.units.speedParts(c.windSpeed),
      gusts: this.units.speed(c.windGusts),
      from: this.i18n.t('wind.dirs').split(',')[windDirectionIndex(c.windDirection)],
      // La flecha apunta hacia donde sopla el viento
      rotation: (c.windDirection + 180) % 360,
    };
  });
  protected readonly cardinals = computed(() => {
    const d = this.i18n.t('wind.dirs').split(',');
    return { n: d[0], e: d[2], s: d[4], w: d[6] };
  });

  // ---- Sol ----
  protected readonly sun = computed(() => {
    const r = this.report();
    const locale = this.i18n.locale();
    const { sunrise, sunset } = r.daily[0];
    const now = r.current.time.getTime();
    const total = sunset.getTime() - sunrise.getTime();
    const progress = Math.min(Math.max((now - sunrise.getTime()) / total, 0), 1);
    const angle = Math.PI * (1 - progress);

    return {
      sunrise: formatTime(sunrise, r.timezone, locale),
      sunset: formatTime(sunset, r.timezone, locale),
      daylight: this.i18n.t('sun.duration', {
        h: Math.floor(total / 3_600_000),
        m: Math.round((total % 3_600_000) / 60_000),
      }),
      up: now >= sunrise.getTime() && now <= sunset.getTime(),
      x: CX + R * Math.cos(angle),
      y: CY - R * Math.sin(angle),
      // Longitud del arco recorrido (para pintar la parte "ya transcurrida")
      dash: Math.PI * R * progress,
      arcLength: Math.PI * R,
    };
  });
  protected readonly arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  // ---- Luna ----
  protected readonly moon = computed(() => {
    const r = this.report();
    const info = moonInfo(r.current.time);
    return {
      ...info,
      label: this.i18n.t(info.key),
      path: moonLitPath(info.phase, 40, 34),
      // En el hemisferio sur la luna se ve espejada
      mirrored: r.place.latitude < 0,
      nextFull: info.daysToFull === 0 ? this.i18n.t('moon.today') : this.i18n.t('moon.inDays', { n: info.daysToFull }),
    };
  });

  // ---- Sensación térmica ----
  protected readonly feels = computed(() => {
    const c = this.c();
    const diff = c.feelsLike - c.temperature;
    let note = this.i18n.t('feels.same');
    if (diff <= -2) note = this.i18n.t(c.windSpeed > 15 ? 'feels.windCool' : 'feels.cooler');
    else if (diff >= 2) note = this.i18n.t(c.humidity > 60 ? 'feels.humid' : 'feels.warmer');
    return { value: this.units.temp(c.feelsLike), note };
  });

  // ---- Visibilidad ----
  protected readonly visibility = computed(() => {
    const m = this.c().visibility;
    const key =
      m >= 20000 ? 'visibility.excellent' : m >= 10000 ? 'visibility.good' : m >= 4000 ? 'visibility.moderate' : 'visibility.low';
    return { ...this.units.distance(m), note: this.i18n.t(key) };
  });

  // ---- Presión ----
  protected readonly pressure = computed(() => {
    const hpa = this.c().pressure;
    // Rango típico 970–1050 hPa mapeado a un arco de -120° a 120°
    const ratio = Math.min(Math.max((hpa - 970) / 80, 0), 1);
    const key = hpa < 1000 ? 'pressure.low' : hpa > 1022 ? 'pressure.high' : 'pressure.normal';
    return { ...this.units.pressure(hpa), rotation: -120 + ratio * 240, note: this.i18n.t(key) };
  });

  // ---- Nubosidad ----
  protected readonly clouds = computed(() => {
    const cover = this.c().cloudCover;
    return this.i18n.t(cover < 20 ? 'clouds.clear' : cover < 70 ? 'clouds.partly' : 'clouds.overcast');
  });

  // ---- Precipitación ----
  protected readonly rain = computed(() => {
    const r = this.report();
    const next = r.hourly.slice(0, 24);
    const peak = next.reduce((a, h) => (h.precipitationProbability > a.precipitationProbability ? h : a), next[0]);
    const today = this.units.precipitation(r.daily[0].precipitationSum);
    if (!peak || peak.precipitationProbability < 10) return { today, note: this.i18n.t('rain.none') };
    return {
      today,
      note: this.i18n.t('rain.peak', {
        p: peak.precipitationProbability,
        time: formatTime(peak.time, r.timezone, this.i18n.locale()),
      }),
    };
  });
}
