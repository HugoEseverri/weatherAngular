import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';
import { environment } from '../../environments/environments';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherService],
    });

    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('debería obtener datos del clima correctamente', (done) => {
    const mockResponse = {
      main: { temp: 25 },
      name: 'Madrid',
    };
    const city = 'Madrid';
    const expectedUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${environment.apiKey}&units=metric&lang=es`;

    service.getWeatherByCity(city).subscribe((data) => {
      expect(data).toEqual(mockResponse);
      done(); // Asegura que la prueba termina correctamente
    });

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('debería manejar errores cuando la API falle', () => {
    const city = 'Madrid';
    const expectedUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${environment.apiKey}&units=metric&lang=es`;

    service.getWeatherByCity(city).subscribe(
      () => fail('debería haber fallado'),
      (error) => {
        expect(error.status).toBe(404);
        expect(error.statusText).toBe('Not Found');
      }
    );

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');

    req.flush('Error', { status: 404, statusText: 'Not Found' });
  });

});
