import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { mapForecast, WeatherService } from './core/services/weather.service';
import { WeatherStore } from './core/services/weather-store.service';
import { FORECAST, PLACE } from './testing/fixtures';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let weather: jasmine.SpyObj<WeatherService>;
  let store: WeatherStore;

  beforeEach(async () => {
    localStorage.clear();
    weather = jasmine.createSpyObj<WeatherService>('WeatherService', ['getReport']);
    weather.getReport.and.returnValue(of(mapForecast(PLACE, FORECAST, null)));

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(withXhr()), { provide: WeatherService, useValue: weather }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    store = TestBed.inject(WeatherStore);
  });

  afterEach(() => localStorage.clear());

  it('se crea correctamente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el clima de la ciudad cargada', () => {
    store.load(PLACE);
    fixture.detectChanges();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#place-name')?.textContent).toContain('Olavarría');
    expect(el.querySelector('.temp .value')?.textContent?.trim()).toBe('13');
    expect(el.querySelector('app-daily-forecast')).not.toBeNull();
  });

  it('cambia a Fahrenheit al elegir °F', () => {
    store.load(PLACE);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const fahrenheit = [...el.querySelectorAll<HTMLButtonElement>('.units button')].find((b) =>
      b.textContent?.includes('°F'),
    )!;
    fahrenheit.click();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(el.querySelector('.temp .value')?.textContent?.trim()).toBe('56');
  });

  it('muestra un estado de error si la API falla', () => {
    weather.getReport.and.returnValue(throwError(() => new Error('API caída')));
    store.load(PLACE);
    fixture.detectChanges();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.error')).not.toBeNull();
    expect(store.report()).toBeNull();
  });
});
