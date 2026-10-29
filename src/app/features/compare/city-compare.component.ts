import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, of, switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Place, PlaceSummary } from '../../core/models/weather.models';
import { PreferencesService, samePlace } from '../../core/services/preferences.service';
import { UnitsService } from '../../core/services/units.service';
import { WeatherService } from '../../core/services/weather.service';
import { placeSlug } from '../../core/utils/slug';
import { formatTime } from '../../core/utils/time';
import { describeCode } from '../../core/utils/weather-codes';
import { FlagComponent } from '../../shared/flag/flag.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { WeatherIconComponent } from '../../shared/weather-icon/weather-icon.component';

/** Tarjetas compactas con el clima actual de las ciudades favoritas, para comparar de un vistazo. */
@Component({
  selector: 'app-city-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FlagComponent, IconComponent, WeatherIconComponent],
  templateUrl: './city-compare.component.html',
  styleUrl: './city-compare.component.scss',
})
export class CityCompareComponent {
  private readonly weather = inject(WeatherService);
  private readonly prefs = inject(PreferencesService);
  protected readonly units = inject(UnitsService);
  protected readonly i18n = inject(I18nService);

  readonly current = input<Place | null>(null);

  private readonly summaries = toSignal(
    toObservable(this.prefs.favorites).pipe(
      debounceTime(150),
      switchMap((places) => this.weather.getSummaries(places).pipe(catchError(() => of<PlaceSummary[]>([])))),
    ),
    { initialValue: [] as PlaceSummary[] },
  );

  protected readonly cards = computed(() => {
    const current = this.current();
    // Mostramos solo las que siguen siendo favoritas (por si se quitó una mientras cargaba)
    const favorites = this.prefs.favorites();
    return this.summaries()
      .filter((s) => favorites.some((f) => samePlace(f, s.place)))
      .map((s) => ({
        ...s,
        slug: placeSlug(s.place),
        condition: this.i18n.t(describeCode(s.code).key),
        localTime: formatTime(new Date(), s.timezone, this.i18n.locale()),
        active: !!current && samePlace(current, s.place),
      }));
  });

  protected readonly hasFavorites = computed(() => this.prefs.favorites().length > 0);
}
