import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Place } from '../models/weather.models';

const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface ReverseResult {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  search(query: string, count = 6): Observable<Place[]> {
    const name = query.trim();
    if (name.length < 2) return of([]);

    return this.http
      .get<{ results?: GeocodingResult[] }>(SEARCH_URL, {
        params: new HttpParams({ fromObject: { name, count, language: 'es', format: 'json' } }),
      })
      .pipe(
        map((r) =>
          (r.results ?? []).map((g) => ({
            id: String(g.id),
            name: g.name,
            region: g.admin1,
            country: g.country,
            countryCode: g.country_code,
            latitude: g.latitude,
            longitude: g.longitude,
          })),
        ),
      );
  }

  /** Nombre legible para unas coordenadas; si el servicio falla se usa un nombre genérico. */
  reverse(latitude: number, longitude: number): Observable<Place> {
    const fallback: Place = {
      id: `geo:${latitude.toFixed(3)},${longitude.toFixed(3)}`,
      name: 'Mi ubicación',
      latitude,
      longitude,
    };

    return this.http
      .get<ReverseResult>(REVERSE_URL, {
        params: new HttpParams({ fromObject: { latitude, longitude, localityLanguage: 'es' } }),
      })
      .pipe(
        map((r) => ({
          ...fallback,
          name: r.locality || r.city || fallback.name,
          region: r.principalSubdivision || undefined,
          country: r.countryName || undefined,
          countryCode: r.countryCode || undefined,
        })),
        catchError(() => of(fallback)),
      );
  }
}
