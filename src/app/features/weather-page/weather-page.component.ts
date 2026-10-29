import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  input,
  PLATFORM_ID,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { Place } from '../../core/models/weather.models';
import { PreferencesService } from '../../core/services/preferences.service';
import { UnitsService } from '../../core/services/units.service';
import { DEFAULT_PLACE, WeatherStore } from '../../core/services/weather-store.service';
import { parseSlug, placeSlug } from '../../core/utils/slug';
import { describeCode } from '../../core/utils/weather-codes';
import { IconComponent } from '../../shared/icon/icon.component';
import { CityCompareComponent } from '../compare/city-compare.component';
import { CurrentWeatherComponent } from '../current/current-weather.component';
import { DailyForecastComponent } from '../daily/daily-forecast.component';
import { WeatherDetailsComponent } from '../details/weather-details.component';
import { HourlyForecastComponent } from '../hourly/hourly-forecast.component';
import { RadarMapComponent } from '../radar/radar-map.component';

export const SITE_URL = 'https://appclimahe.vercel.app';

@Component({
  selector: 'app-weather-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrentWeatherComponent,
    HourlyForecastComponent,
    DailyForecastComponent,
    WeatherDetailsComponent,
    RadarMapComponent,
    CityCompareComponent,
    IconComponent,
  ],
  templateUrl: './weather-page.component.html',
  styleUrl: './weather-page.component.scss',
})
export class WeatherPageComponent {
  protected readonly store = inject(WeatherStore);
  protected readonly i18n = inject(I18nService);
  private readonly prefs = inject(PreferencesService);
  private readonly units = inject(UnitsService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Segmento `:slug` de la URL (vinculado por el router). */
  readonly slug = input<string>();

  protected readonly report = this.store.report;
  protected readonly firstLoad = computed(() => !this.report() && this.store.status() !== 'error');
  protected readonly fatalError = computed(() => !this.report() && this.store.status() === 'error');

  constructor() {
    // Sincroniza la ciudad mostrada con la URL
    effect(() => {
      const slug = this.slug();
      untracked(() => this.resolve(slug));
    });

    // Título y metadatos para buscadores y vistas previas al compartir
    effect(() => this.updateMeta());
  }

  protected retry(): void {
    const slug = this.slug();
    if (slug) this.resolve(slug);
    else this.store.load(this.prefs.lastPlace() ?? DEFAULT_PLACE);
  }

  private resolve(slug: string | undefined): void {
    if (!slug) {
      // En la portada vamos directo a la última ciudad consultada (solo en el navegador:
      // el HTML prerenderizado muestra los esqueletos de carga).
      if (this.isBrowser) {
        const place = this.prefs.lastPlace() ?? DEFAULT_PLACE;
        this.router.navigate(['/clima', placeSlug(place)], { replaceUrl: true, state: { place } });
      }
      return;
    }

    const ref = parseSlug(slug);
    if (!ref) {
      this.store.error.set('error.notFound');
      this.store.status.set('error');
      return;
    }
    const known = this.isBrowser ? ((history.state?.place as Place | undefined) ?? null) : null;
    this.store.loadRef(ref, known);
  }

  private updateMeta(): void {
    const r = this.report();
    const t = this.i18n.t.bind(this.i18n);
    let title = t('meta.homeTitle');
    let description = t('meta.homeDescription');
    let url = SITE_URL + '/';

    if (r && this.slug()) {
      const city = r.place.name || t('place.myLocation');
      const params = {
        city,
        temp: this.units.temp(r.current.temperature),
        cond: t(describeCode(r.current.code).key).toLowerCase(),
        max: this.units.temp(r.daily[0].max),
        min: this.units.temp(r.daily[0].min),
      };
      title = t('meta.cityTitle', params);
      description = t('meta.cityDescription', params);
      url = `${SITE_URL}/clima/${placeSlug(r.place)}`;
    }

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  }
}
