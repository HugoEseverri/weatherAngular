import { Routes } from '@angular/router';
import { WeatherPageComponent } from './features/weather-page/weather-page.component';

export const routes: Routes = [
  // La portada redirige (en el navegador) a la última ciudad consultada
  { path: '', component: WeatherPageComponent },
  { path: 'clima/:slug', component: WeatherPageComponent },
  { path: '**', redirectTo: '' },
];
