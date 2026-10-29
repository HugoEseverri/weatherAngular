export type Units = 'metric' | 'imperial';
export type Language = 'es' | 'en';

export type ConditionKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface Place {
  id: string;
  name: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentConditions {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  dewPoint: number;
  isDay: boolean;
  code: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  precipitation: number;
  visibility: number; // metros
  uvIndex: number;
}

export interface HourlyPoint {
  time: Date;
  temperature: number;
  code: number;
  isDay: boolean;
  precipitationProbability: number;
  precipitation: number; // mm
  windSpeed: number; // km/h
  windDirection: number;
}

export interface DailyPoint {
  date: Date;
  code: number;
  min: number;
  max: number;
  precipitationProbability: number;
  precipitationSum: number;
  sunrise: Date;
  sunset: Date;
  uvIndexMax: number;
  windSpeedMax: number;
}

export interface AirQuality {
  aqi: number; // European AQI
  pm25: number;
  pm10: number;
  ozone: number;
  nitrogenDioxide: number;
}

export interface WeatherReport {
  place: Place;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  airQuality: AirQuality | null;
  fetchedAt: Date;
}

export interface PlaceSummary {
  place: Place;
  temperature: number;
  code: number;
  isDay: boolean;
  max: number;
  min: number;
  timezone: string;
}
