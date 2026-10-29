import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Place, WeatherReport } from '../models/weather.models';
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
  readonly error = signal<string | null>(null);
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
    this.request?.unsubscribe();
    this.status.set('loading');
    this.error.set(null);

    this.request = this.weather.getReport(place).subscribe({
      next: (report) => {
        this.report.set(report);
        this.status.set('ready');
        this.prefs.visit(place);
      },
      error: (err: unknown) => {
        this.status.set('error');
        this.error.set(
          err instanceof HttpErrorResponse && err.status === 0
            ? 'No hay conexión. Revisá tu internet e intentá de nuevo.'
            : 'No pudimos obtener el pronóstico. Intentá nuevamente en unos segundos.',
        );
      },
    });
  }

  refresh(): void {
    const place = this.report()?.place ?? this.prefs.lastPlace();
    if (place) this.load(place);
  }

  /** Pide la ubicación al navegador y carga el clima del lugar. */
  locate(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.error.set('Tu navegador no permite obtener la ubicación.');
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.geocoding.reverse(coords.latitude, coords.longitude).subscribe((place) => {
          this.locating.set(false);
          this.load(place);
        });
      },
      (err) => {
        this.locating.set(false);
        this.error.set(
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado. Podés buscar tu ciudad manualmente.'
            : 'No pudimos determinar tu ubicación.',
        );
        if (!this.report()) this.status.set('error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }
}
