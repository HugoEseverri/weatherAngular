import { Component } from '@angular/core';
import { WeatherService } from './services/weather.service';
import { NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [NgIf, FormsModule],
})
export class AppComponent {
  weather: any;
  city: string = '';

  constructor(private weatherService: WeatherService) {}

  getWeatherByCity(): void {
    if (!this.city.trim()) return;
    this.weatherService.getWeatherByCity(this.city).subscribe((data) => {
      this.weather = data;
    });
  }
}
