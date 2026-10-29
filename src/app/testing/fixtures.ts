import { Place } from '../core/models/weather.models';
import { ForecastResponse } from '../core/services/weather.service';

export const PLACE: Place = { id: '1', name: 'Olavarría', countryCode: 'AR', latitude: -36.89, longitude: -60.32 };

export const FORECAST: ForecastResponse = {
  timezone: 'America/Argentina/Buenos_Aires',
  utc_offset_seconds: -10800,
  current: {
    time: '2026-10-29T09:00',
    temperature_2m: 13.4,
    relative_humidity_2m: 84,
    apparent_temperature: 12.3,
    is_day: 1,
    precipitation: 0,
    weather_code: 2,
    cloud_cover: 55,
    pressure_msl: 1020.3,
    wind_speed_10m: 9.3,
    wind_direction_10m: 134,
    wind_gusts_10m: 22.7,
    dew_point_2m: 10.8,
    visibility: 46060,
    uv_index: 3.6,
  },
  hourly: {
    time: ['2026-10-29T09:00', '2026-10-29T10:00'],
    temperature_2m: [13.4, 15.2],
    weather_code: [2, 3],
    precipitation_probability: [0, 8],
    is_day: [1, 1],
  },
  daily: {
    time: ['2026-10-29'],
    weather_code: [3],
    temperature_2m_max: [22],
    temperature_2m_min: [10],
    sunrise: ['2026-10-29T06:01'],
    sunset: ['2026-10-29T19:35'],
    uv_index_max: [7.2],
    precipitation_sum: [0],
    precipitation_probability_max: [10],
    wind_speed_10m_max: [20],
  },
};
