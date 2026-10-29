import { inject, Injectable } from '@angular/core';
import { PreferencesService } from './preferences.service';

/**
 * Los datos siempre llegan en sistema métrico; la conversión se hace en el cliente
 * para que cambiar °C/°F sea instantáneo y no requiera otra petición.
 * Al leer la señal de unidades, las plantillas que usan estos métodos se actualizan solas.
 */
@Injectable({ providedIn: 'root' })
export class UnitsService {
  private readonly prefs = inject(PreferencesService);

  private get imperial(): boolean {
    return this.prefs.units() === 'imperial';
  }

  tempValue(celsius: number): number {
    return Math.round(this.imperial ? celsius * 1.8 + 32 : celsius);
  }

  temp(celsius: number): string {
    return `${this.tempValue(celsius)}°`;
  }

  tempUnit(): string {
    return this.imperial ? '°F' : '°C';
  }

  speed(kmh: number): string {
    return this.imperial ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
  }

  speedParts(kmh: number): { value: number; unit: string } {
    return this.imperial
      ? { value: Math.round(kmh * 0.621371), unit: 'mph' }
      : { value: Math.round(kmh), unit: 'km/h' };
  }

  distance(meters: number): { value: string; unit: string } {
    if (this.imperial) {
      const mi = meters / 1609.34;
      return { value: mi >= 10 ? Math.round(mi).toString() : mi.toFixed(1), unit: 'mi' };
    }
    const km = meters / 1000;
    return { value: km >= 10 ? Math.round(km).toString() : km.toFixed(1), unit: 'km' };
  }

  precipitation(mm: number): string {
    return this.imperial ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
  }

  pressure(hpa: number): { value: string; unit: string } {
    return this.imperial
      ? { value: (hpa * 0.02953).toFixed(2), unit: 'inHg' }
      : { value: Math.round(hpa).toString(), unit: 'hPa' };
  }
}
