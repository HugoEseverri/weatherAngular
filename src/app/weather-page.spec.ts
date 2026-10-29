import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { routes } from './app.routes';
import { GeocodingService } from './core/services/geocoding.service';
import { PreferencesService } from './core/services/preferences.service';
import { mapForecast, WeatherService } from './core/services/weather.service';
import { FORECAST, PLACE } from './testing/fixtures';

describe('Página del clima', () => {
  let weather: { getReport: Mock<WeatherService['getReport']>; getSummaries: Mock<WeatherService['getSummaries']> };
  let geocoding: { getById: Mock<GeocodingService['getById']> };

  beforeEach(() => {
    localStorage.clear();
    weather = {
      getReport: vi.fn().mockReturnValue(of(mapForecast(PLACE, FORECAST, null))),
      getSummaries: vi.fn().mockReturnValue(of([])),
    };
    geocoding = { getById: vi.fn().mockReturnValue(of(PLACE)) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter(routes, withComponentInputBinding()),
        { provide: WeatherService, useValue: weather },
        { provide: GeocodingService, useValue: geocoding },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  async function open(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.fixture.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  it('resuelve la ciudad desde la URL y muestra su clima', async () => {
    const el = await open('/clima/olavarria-1');

    expect(geocoding.getById).toHaveBeenCalledWith('1', expect.any(String));
    expect(el.querySelector('#place-name')?.textContent).toContain('Olavarría');
    expect(el.querySelector('.temp .value')?.textContent?.trim()).toBe('13');
    expect(el.querySelector('app-daily-forecast')).not.toBeNull();
  });

  it('actualiza el título de la página con el clima de la ciudad', async () => {
    TestBed.inject(PreferencesService).setLang('es');
    await open('/clima/olavarria-1');
    expect(document.title).toContain('Olavarría');
    expect(document.title).toContain('13°');
  });

  it('cambia a Fahrenheit al elegir °F', async () => {
    const el = await open('/clima/olavarria-1');
    TestBed.inject(PreferencesService).setUnits('imperial');
    TestBed.tick();
    expect(el.querySelector('.temp .value')?.textContent?.trim()).toBe('56');
  });

  it('cambia los textos al elegir inglés', async () => {
    const el = await open('/clima/olavarria-1');
    TestBed.inject(PreferencesService).setLang('en');
    TestBed.tick();
    expect(el.querySelector('#hourly-title')?.textContent).toContain('Next 24 hours');
    expect(document.documentElement.lang).toBe('en');
  });

  it('muestra un estado de error si la URL no corresponde a una ciudad', async () => {
    const el = await open('/clima/no-es-una-ciudad');
    expect(el.querySelector('.error')).not.toBeNull();
    expect(weather.getReport).not.toHaveBeenCalled();
  });

  it('muestra un estado de error si la API falla', async () => {
    weather.getReport.mockReturnValue(throwError(() => new Error('API caída')));
    const el = await open('/clima/olavarria-1');
    expect(el.querySelector('.error')).not.toBeNull();
  });
});
