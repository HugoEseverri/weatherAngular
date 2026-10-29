import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable, of, Subscription, switchMap } from 'rxjs';
import { TranslationKey } from '../i18n/es';
import { Place, WeatherReport } from '../models/weather.models';
import { PlaceRef } from '../utils/slug';
import { describeCode } from '../utils/weather-codes';
import { GeocodingService } from './geocoding.service';
import { PreferencesService } from './preferences.service';
import { WeatherService } from './weather.service';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SkyTheme =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy-day'
  | 'cloudy-night'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'fog';

export const DEFAULT_PLACE: Place = {
  id: '3435910',
  name: 'Buenos Aires',
  region: 'Ciudad Autónoma de Buenos Aires',
  country: 'Argentina',
  countryCode: 'AR',
  latitude: -34.61315,
  longitude: -58.37723,
};

/** Estado global de la app: ciudad seleccionada, reporte y estado de carga. */
@Injectable({ providedIn: 'root' })
export class WeatherStore {
  private readonly weather = inject(WeatherService);
  private readonly geocoding = inject(GeocodingService);
  private readonly prefs = inject(PreferencesService);

  private request?: Subscription;

  readonly report = signal<WeatherReport | null>(null);
  readonly status = signal<LoadStatus>('idle');
  readonly error = signal<TranslationKey | null>(null);
  readonly locating = signal(false);

  readonly theme = computed<SkyTheme>(() => {
    const r = this.report();
    if (!r) return 'clear-day';
    const kind = describeCode(r.current.code).kind;
    const day = r.current.isDay;
    switch (kind) {
      case 'clear':
        return day ? 'clear-day' : 'clear-night';
      case 'partly-cloudy':
      case 'cloudy':
        return day ? 'cloudy-day' : 'cloudy-night';
      case 'drizzle':
      case 'rain':
        return 'rain';
      default:
        return kind;
    }
  });

  load(place: Place): void {
    this.run(of(place));
  }

  /**
   * Carga una ciudad referenciada desde la URL. Si ya tenemos sus datos
   * (por ejemplo, porque viene del buscador) evitamos volver a geocodificarla.
   */
  loadRef(ref: PlaceRef, known?: Place | null): void {
    const current = this.report()?.place;
    const candidates = [known, current, ...this.prefs.favorites(), ...this.prefs.recents()];
    const match = candidates.find((p) => p && matchesRef(p, ref));

    if (match) {
      this.run(of(match));
    } else if (ref.kind === 'id') {
      this.run(this.geocoding.getById(ref.id, this.prefs.lang()), 'error.notFound');
    } else {
      this.run(this.geocoding.reverse(ref.latitude, ref.longitude, this.prefs.lang()));
    }
  }

  refresh(): void {
    const place = this.report()?.place ?? this.prefs.lastPlace();
    if (place) this.load(place);
  }

  /** Pide la ubicación al navegador y devuelve el lugar encontrado (o null si falla). */
  async locate(): Promise<Place | null> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.error.set('error.geoUnsupported');
      return null;
    }
    this.locating.set(true);
    try {
      const { coords } = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 10 * 60 * 1000,
        }),
      );
      return await firstValueFrom(this.geocoding.reverse(coords.latitude, coords.longitude, this.prefs.lang()));
    } catch (err) {
      const denied = (err as GeolocationPositionError)?.code === 1;
      this.error.set(denied ? 'error.geoDenied' : 'error.geoFailed');
      return null;
    } finally {
      this.locating.set(false);
    }
  }

  private run(place$: Observable<Place>, resolveError: TranslationKey = 'error.generic'): void {
    this.request?.unsubscribe();
    this.status.set('loading');
    this.error.set(null);

    let resolved = false;
    this.request = place$
      .pipe(
        switchMap((place) => {
          resolved = true;
          return this.weather.getReport(place);
        }),
      )
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.status.set('ready');
          this.prefs.visit(report.place);
        },
        error: (err: unknown) => {
          this.status.set('error');
          this.error.set(
            err instanceof HttpErrorResponse && err.status === 0
              ? 'error.offline'
              : resolved
                ? 'error.generic'
                : resolveError,
          );
        },
      });
  }
}

function matchesRef(place: Place, ref: PlaceRef): boolean {
  return ref.kind === 'id'
    ? place.id === ref.id
    : Math.abs(place.latitude - ref.latitude) < 0.001 && Math.abs(place.longitude - ref.longitude) < 0.001;
}
