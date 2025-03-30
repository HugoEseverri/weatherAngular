import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { WeatherService } from './services/weather.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let WeatherServiceMock: any;

  beforeEach(() => {
    WeatherServiceMock = {
      getWeatherByCity: jasmine.createSpy('getWeatherByCity'),
    };

    TestBed.configureTestingModule({
      imports: [FormsModule, AppComponent],
      providers: [{ provide: WeatherService, useValue: WeatherServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debería llamar a getWeatherByCity() si el input está vacío', () => {
    component.city = ' ';
    component.getWeatherByCity();
    expect(WeatherServiceMock.getWeatherByCity).not.toHaveBeenCalled();
  });

  it('debería llamar a getWeatherByCity() cuando se ingresa una ciudad', () => {
    const mockWeather = { temp: 22, city: 'Olavarría' };
    WeatherServiceMock.getWeatherByCity.and.returnValue(of(mockWeather));

    component.city = 'Olavarría';
    component.getWeatherByCity();

    expect(WeatherServiceMock.getWeatherByCity).toHaveBeenCalledWith('Olavarría');
    expect(component.weather).toEqual(mockWeather);
  });

  it('debería manejar errores si la API falla', (done) => {
    WeatherServiceMock.getWeatherByCity.and.returnValue(throwError(() => new Error('Error API')));

    component.city = 'Barcelona';

    component.getWeatherByCity();

    fixture.whenStable().then(() => {
      expect(component.weather).toBeUndefined();
      done();
    });
  });

});
