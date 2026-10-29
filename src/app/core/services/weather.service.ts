import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { AirQuality, DailyPoint, HourlyPoint, Place, PlaceSummary, WeatherReport } from '../models/weather.models';
import { parseLocal } from '../utils/time';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'dew_point_2m',
  'visibility',
  'uv_index',
];
const HOURLY_VARS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'precipitation',
  'is_day',
  'wind_speed_10m',
  'wind_direction_10m',
];
const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
];

export const FORECAST_DAYS = 10;
export const FORECAST_HOURS = 25;

/** Forma cruda de la respuesta de Open-Meteo (solo los campos que pedimos). */
export interface ForecastResponse {
  timezone: string;
  utc_offset_seconds: number;
  current: Record<string, number | string>;
  hourly: Record<string, (number | string)[]>;
  daily: Record<string, (number | string)[]>;
}

interface AirQualityResponse {
  current: Record<string, number | string>;
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  getReport(place: Place): Observable<WeatherReport> {
    const coords = { latitude: place.latitude, longitude: place.longitude };

    const forecast$ = this.http.get<ForecastResponse>(FORECAST_URL, {
      params: new HttpParams({
        fromObject: {
          ...coords,
          current: CURRENT_VARS.join(','),
          hourly: HOURLY_VARS.join(','),
          daily: DAILY_VARS.join(','),
          timezone: 'auto',
          forecast_days: FORECAST_DAYS,
          forecast_hours: FORECAST_HOURS,
          wind_speed_unit: 'kmh',
        },
      }),
    });

    // La calidad del aire es un dato complementario: si falla, el reporte igual se muestra.
    const airQuality$ = this.http
      .get<AirQualityResponse>(AIR_QUALITY_URL, {
        params: new HttpParams({
          fromObject: { ...coords, current: 'european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide' },
        }),
      })
      .pipe(
        map((r) => mapAirQuality(r)),
        catchError(() => of(null)),
      );

    return forkJoin([forecast$, airQuality$]).pipe(
      map(([forecast, airQuality]) => mapForecast(place, forecast, airQuality)),
    );
  }

  /** Resumen liviano de varias ciudades en una sola petición (Open-Meteo acepta listas de coordenadas). */
  getSummaries(places: Place[]): Observable<PlaceSummary[]> {
    if (!places.length) return of([]);

    return this.http
      .get<SummaryResponse | SummaryResponse[]>(FORECAST_URL, {
        params: new HttpParams({
          fromObject: {
            latitude: places.map((p) => p.latitude).join(','),
            longitude: places.map((p) => p.longitude).join(','),
            current: 'temperature_2m,weather_code,is_day',
            daily: 'temperature_2m_max,temperature_2m_min',
            forecast_days: 1,
            timezone: 'auto',
          },
        }),
      })
      .pipe(
        // Con una sola ubicación la API devuelve un objeto en lugar de un arreglo.
        map((r) => (Array.isArray(r) ? r : [r])),
        map((list) =>
          list.map((r, i) => ({
            place: places[i],
            temperature: Number(r.current['temperature_2m']),
            code: Number(r.current['weather_code']),
            isDay: Number(r.current['is_day']) === 1,
            max: Number(r.daily['temperature_2m_max'][0]),
            min: Number(r.daily['temperature_2m_min'][0]),
            timezone: r.timezone,
          })),
        ),
      );
  }
}

interface SummaryResponse {
  timezone: string;
  current: Record<string, number | string>;
  daily: Record<string, number[]>;
}

function mapAirQuality(r: AirQualityResponse): AirQuality | null {
  const c = r.current;
  if (c?.['european_aqi'] == null) return null;
  return {
    aqi: Number(c['european_aqi']),
    pm25: Number(c['pm2_5']),
    pm10: Number(c['pm10']),
    ozone: Number(c['ozone']),
    nitrogenDioxide: Number(c['nitrogen_dioxide']),
  };
}

export function mapForecast(place: Place, r: ForecastResponse, airQuality: AirQuality | null): WeatherReport {
  const offset = r.utc_offset_seconds;
  const c = r.current;
  const num = (v: number | string | undefined) => Number(v ?? 0);

  const hourly: HourlyPoint[] = (r.hourly['time'] as string[]).map((t, i) => ({
    time: parseLocal(t, offset),
    temperature: num(r.hourly['temperature_2m'][i]),
    code: num(r.hourly['weather_code'][i]),
    isDay: num(r.hourly['is_day'][i]) === 1,
    precipitationProbability: num(r.hourly['precipitation_probability'][i]),
    precipitation: num(r.hourly['precipitation']?.[i]),
    windSpeed: num(r.hourly['wind_speed_10m']?.[i]),
    windDirection: num(r.hourly['wind_direction_10m']?.[i]),
  }));

  const daily: DailyPoint[] = (r.daily['time'] as string[]).map((t, i) => ({
    date: parseLocal(t, offset),
    code: num(r.daily['weather_code'][i]),
    min: num(r.daily['temperature_2m_min'][i]),
    max: num(r.daily['temperature_2m_max'][i]),
    precipitationProbability: num(r.daily['precipitation_probability_max'][i]),
    precipitationSum: num(r.daily['precipitation_sum'][i]),
    sunrise: parseLocal(r.daily['sunrise'][i] as string, offset),
    sunset: parseLocal(r.daily['sunset'][i] as string, offset),
    uvIndexMax: num(r.daily['uv_index_max'][i]),
    windSpeedMax: num(r.daily['wind_speed_10m_max'][i]),
  }));

  return {
    place,
    timezone: r.timezone,
    utcOffsetSeconds: offset,
    current: {
      time: parseLocal(c['time'] as string, offset),
      temperature: num(c['temperature_2m']),
      feelsLike: num(c['apparent_temperature']),
      humidity: num(c['relative_humidity_2m']),
      dewPoint: num(c['dew_point_2m']),
      isDay: num(c['is_day']) === 1,
      code: num(c['weather_code']),
      cloudCover: num(c['cloud_cover']),
      pressure: num(c['pressure_msl']),
      windSpeed: num(c['wind_speed_10m']),
      windGusts: num(c['wind_gusts_10m']),
      windDirection: num(c['wind_direction_10m']),
      precipitation: num(c['precipitation']),
      visibility: num(c['visibility']),
      uvIndex: num(c['uv_index']),
    },
    hourly,
    daily,
    airQuality,
    fetchedAt: new Date(),
  };
}
