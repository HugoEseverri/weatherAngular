import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly prefs = inject(PreferencesService);

  readonly report = input.required<WeatherReport>();
  readonly refreshing = input(false);
  readonly refresh = output<void>();

  /** Reloj que avanza cada 30 s para mostrar la hora local y "actualizado hace…". */
  private readonly now = signal(new Date());

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const id = setInterval(() => this.now.set(new Date()), 30_000);
      inject(DestroyRef).onDestroy(() => clearInterval(id));
    }
  }

  protected readonly condition = computed(() => describeCode(this.report().current.code).label);
  protected readonly today = computed(() => this.report().daily[0]);
  protected readonly isFavorite = computed(() => {
    this.prefs.favorites();
    return this.prefs.isFavorite(this.report().place);
  });

  protected readonly location = computed(() => {
    const p = this.report().place;
    return [p.region, p.country].filter((v) => v && v !== p.name).join(', ');
  });

  protected readonly localTime = computed(() => formatTime(this.now(), this.report().timezone));
  protected readonly localDate = computed(() => formatLongDate(this.now(), this.report().timezone));

  protected readonly updatedAgo = computed(() => {
    const minutes = Math.floor((this.now().getTime() - this.report().fetchedAt.getTime()) / 60_000);
    if (minutes < 1) return 'Actualizado recién';
    if (minutes < 60) return `Actualizado hace ${minutes} min`;
    return `Actualizado hace ${Math.floor(minutes / 60)} h`;
  });

  /** Resumen en lenguaje natural de lo que viene en las próximas horas. */
  protected readonly outlook = computed(() => {
    const r = this.report();
    const next = r.hourly.slice(1, 13);
    const rainy = next.find((h) => h.precipitationProbability >= 50);
    const today = r.daily[0];
    const delta = Math.round(today.max - r.current.temperature);

    if (rainy) {
      return `${probabilityWord(rainy.precipitationProbability)} de precipitaciones desde las ${formatHour(rainy.time, r.timezone)}.`;
    }
    if (r.current.isDay && delta >= 2) {
      return `Sin lluvias a la vista. La temperatura subirá hasta ${this.units.temp(today.max)} hoy.`;
    }
    if (r.current.windGusts >= 50) {
      return `Ráfagas de hasta ${this.units.speed(r.current.windGusts)}. Precaución al aire libre.`;
    }
    return 'Sin lluvias previstas en las próximas 12 horas.';
  });

  protected toggleFavorite(): void {
    this.prefs.toggleFavorite(this.report().place);
  }
}

function probabilityWord(p: number): string {
  if (p >= 80) return 'Alta probabilidad';
  if (p >= 60) return 'Probabilidad';
  return 'Posibilidad';
}
