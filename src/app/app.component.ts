import { Component } from '@angular/core';
import { WeatherService } from './services/weather.service';
import { NgIf } from '@angular/common';
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

  convertUnixTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getWeatherIcon(iconCode: string): string {
    return `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}
