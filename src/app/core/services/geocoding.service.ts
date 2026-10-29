import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Language, Place } from '../models/weather.models';

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1';
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

function toPlace(g: GeocodingResult): Place {
  return {
    id: String(g.id),
    name: g.name,
    region: g.admin1,
    country: g.country,
    countryCode: g.country_code,
    latitude: g.latitude,
    longitude: g.longitude,
  };
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  search(query: string, lang: Language = 'es', count = 6): Observable<Place[]> {
    const name = query.trim();
    if (name.length < 2) return of([]);

    return this.http
      .get<{ results?: GeocodingResult[] }>(`${BASE_URL}/search`, {
        params: new HttpParams({ fromObject: { name, count, language: lang, format: 'json' } }),
      })
      .pipe(map((r) => (r.results ?? []).map(toPlace)));
  }

  /** Ciudad a partir de su id de GeoNames (el que viaja en la URL). */
  getById(id: string, lang: Language = 'es'): Observable<Place> {
    return this.http
      .get<GeocodingResult>(`${BASE_URL}/get`, {
        params: new HttpParams({ fromObject: { id, language: lang } }),
      })
      .pipe(map(toPlace));
  }

  /** Nombre legible para unas coordenadas; si el servicio falla se usa `fallbackName`. */
  reverse(latitude: number, longitude: number, lang: Language = 'es', fallbackName = ''): Observable<Place> {
    const fallback: Place = { id: coordsId(latitude, longitude), name: fallbackName, latitude, longitude };

    return this.http
      .get<ReverseResult>(REVERSE_URL, {
        params: new HttpParams({ fromObject: { latitude, longitude, localityLanguage: lang } }),
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

export function coordsId(latitude: number, longitude: number): string {
  return `geo:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}
