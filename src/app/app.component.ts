import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { Place } from './core/models/weather.models';
import { PreferencesService } from './core/services/preferences.service';
import { DEFAULT_PLACE, WeatherStore } from './core/services/weather-store.service';
import { SkyBackdropComponent } from './features/backdrop/sky-backdrop.component';
import { CurrentWeatherComponent } from './features/current/current-weather.component';
import { DailyForecastComponent } from './features/daily/daily-forecast.component';
import { WeatherDetailsComponent } from './features/details/weather-details.component';
import { HourlyForecastComponent } from './features/hourly/hourly-forecast.component';
import { SearchBarComponent } from './features/search/search-bar.component';
import { IconComponent } from './shared/icon/icon.component';

const AUTO_REFRESH_MS = 15 * 60 * 1000;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SkyBackdropComponent,
    SearchBarComponent,
    CurrentWeatherComponent,
    HourlyForecastComponent,
    DailyForecastComponent,
    WeatherDetailsComponent,
    IconComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly store = inject(WeatherStore);
  protected readonly prefs = inject(PreferencesService);

  protected readonly report = this.store.report;
  protected readonly firstLoad = computed(() => !this.report() && this.store.status() !== 'error');
  protected readonly fatalError = computed(() => !this.report() && this.store.status() === 'error');
  /** Un error con datos ya visibles se muestra como aviso, sin ocultar el pronóstico. */
  protected readonly softError = computed(() => (this.report() ? this.store.error() : null));

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Las consultas se hacen solo en el navegador: el HTML prerenderizado muestra los esqueletos.
    afterNextRender(() => {
      this.store.load(this.prefs.lastPlace() ?? DEFAULT_PLACE);

      const id = setInterval(() => {
        if (document.visibilityState === 'visible') this.store.refresh();
      }, AUTO_REFRESH_MS);
      destroyRef.onDestroy(() => clearInterval(id));
    });
  }

  protected select(place: Place): void {
    this.store.load(place);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected retry(): void {
    this.store.load(this.prefs.lastPlace() ?? DEFAULT_PLACE);
  }
}
