import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { I18nService } from '../../core/i18n/i18n.service';
import { WeatherReport } from '../../core/models/weather.models';
import { PreferencesService } from '../../core/services/preferences.service';
import { UnitsService } from '../../core/services/units.service';
import { formatHour, formatLongDate, formatTime } from '../../core/utils/time';
import { describeCode } from '../../core/utils/weather-codes';
import { FlagComponent } from '../../shared/flag/flag.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { WeatherIconComponent } from '../../shared/weather-icon/weather-icon.component';

@Component({
  selector: 'app-current-weather',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlagComponent, IconComponent, WeatherIconComponent],
  templateUrl: './current-weather.component.html',
  styleUrl: './current-weather.component.scss',
})
export class CurrentWeatherComponent {
  protected readonly units = inject(UnitsService);
  protected readonly i18n = inject(I18nService);
  private readonly prefs = inject(PreferencesService);

  readonly report = input.required<WeatherReport>();
  readonly refreshing = input(false);
  readonly refresh = output<void>();

  /** Reloj que avanza cada 30 s para mostrar la hora local y "actualizado hace…". */
  private readonly now = signal(new Date());
  protected readonly copied = signal(false);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const id = setInterval(() => this.now.set(new Date()), 30_000);
      inject(DestroyRef).onDestroy(() => clearInterval(id));
    }
  }

  protected readonly condition = computed(() => this.i18n.t(describeCode(this.report().current.code).key));
  protected readonly today = computed(() => this.report().daily[0]);
  protected readonly placeName = computed(() => this.report().place.name || this.i18n.t('place.myLocation'));
  protected readonly isFavorite = computed(() => {
    this.prefs.favorites();
    return this.prefs.isFavorite(this.report().place);
  });

  protected readonly location = computed(() => {
    const p = this.report().place;
    return [p.region, p.country].filter((v) => v && v !== p.name).join(', ');
  });

  protected readonly localTime = computed(() =>
    formatTime(this.now(), this.report().timezone, this.i18n.locale()),
  );
  protected readonly localDate = computed(() =>
    formatLongDate(this.now(), this.report().timezone, this.i18n.locale()),
  );

  protected readonly updatedAgo = computed(() => {
    const minutes = Math.floor((this.now().getTime() - this.report().fetchedAt.getTime()) / 60_000);
    if (minutes < 1) return this.i18n.t('current.updatedNow');
    if (minutes < 60) return this.i18n.t('current.updatedMin', { n: minutes });
    return this.i18n.t('current.updatedHour', { n: Math.floor(minutes / 60) });
  });

  /** Resumen en lenguaje natural de lo que viene en las próximas horas. */
  protected readonly outlook = computed(() => {
    const r = this.report();
    const t = this.i18n.t.bind(this.i18n);
    const rainy = r.hourly.slice(1, 13).find((h) => h.precipitationProbability >= 50);
    const today = r.daily[0];

    if (rainy) {
      const p = rainy.precipitationProbability;
      const prob = t(p >= 80 ? 'outlook.probHigh' : p >= 60 ? 'outlook.probMid' : 'outlook.probLow');
      const time = formatHour(rainy.time, r.timezone, this.i18n.locale());
      return t('outlook.rain', { prob, time });
    }
    if (r.current.isDay && today.max - r.current.temperature >= 2) {
      return t('outlook.warming', { t: this.units.temp(today.max) });
    }
    if (r.current.windGusts >= 50) {
      return t('outlook.gusts', { v: this.units.speed(r.current.windGusts) });
    }
    return t('outlook.dry');
  });

  protected toggleFavorite(): void {
    this.prefs.toggleFavorite(this.report().place);
  }

  protected async share(): Promise<void> {
    const url = location.href;
    const title = document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // El usuario canceló el diálogo: no hay nada que hacer.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Sin acceso al portapapeles.
    }
  }
}
