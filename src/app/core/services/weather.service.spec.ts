import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WeatherReport } from '../models/weather.models';
import { FORECAST, PLACE } from '../../testing/fixtures';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushForecast() {
    const req = http.expectOne((r) => r.url === 'https://api.open-meteo.com/v1/forecast');
    expect(req.request.params.get('latitude')).toBe(String(PLACE.latitude));
    expect(req.request.params.get('timezone')).toBe('auto');
    req.flush(FORECAST);
  }

  it('combina pronóstico y calidad del aire en un reporte', () => {
    let report: WeatherReport | undefined;
    service.getReport(PLACE).subscribe((r) => (report = r));

    flushForecast();
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com'))
      .flush({ current: { european_aqi: 16, pm2_5: 3.9, pm10: 4.1, ozone: 45, nitrogen_dioxide: 1.7 } });

    expect(report).toBeDefined();
    expect(report!.place).toEqual(PLACE);
    expect(report!.current.temperature).toBe(13.4);
    expect(report!.current.isDay).toBeTrue();
    expect(report!.hourly.length).toBe(2);
    expect(report!.daily[0].max).toBe(22);
    expect(report!.airQuality?.aqi).toBe(16);
  });

  it('convierte los horarios locales de la ciudad a instantes UTC', () => {
    let report: WeatherReport | undefined;
    service.getReport(PLACE).subscribe((r) => (report = r));
    flushForecast();
    http.expectOne((r) => r.url.startsWith('https://air-quality-api')).flush({ current: {} });

    // 09:00 en UTC-3 son las 12:00 UTC
    expect(report!.current.time.toISOString()).toBe('2026-10-29T12:00:00.000Z');
  });

  it('muestra el reporte aunque falle la calidad del aire', () => {
    let report: WeatherReport | undefined;
    service.getReport(PLACE).subscribe((r) => (report = r));
    flushForecast();
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api'))
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(report).toBeDefined();
    expect(report!.airQuality).toBeNull();
  });

  it('propaga el error si falla el pronóstico', () => {
    let failed = false;
    service.getReport(PLACE).subscribe({ error: () => (failed = true) });
    http
      .expectOne((r) => r.url === 'https://api.open-meteo.com/v1/forecast')
      .flush('error', { status: 500, statusText: 'Server Error' });
    http.match((r) => r.url.startsWith('https://air-quality-api'));

    expect(failed).toBeTrue();
  });
});

