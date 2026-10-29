import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Language, Place, Units } from '../models/weather.models';

const STORAGE_KEY = 'clima:prefs:v1';
const MAX_RECENTS = 6;

interface StoredPrefs {
  units: Units;
  lang: Language;
  favorites: Place[];
  recents: Place[];
  lastPlace: Place | null;
}

const DEFAULTS: StoredPrefs = { units: 'metric', lang: 'es', favorites: [], recents: [], lastPlace: null };

/** Preferencias del usuario persistidas en localStorage (solo en el navegador). */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<StoredPrefs>(this.load());

  readonly units = computed(() => this.state().units);
  readonly lang = computed(() => this.state().lang);
  readonly favorites = computed(() => this.state().favorites);
  readonly recents = computed(() => this.state().recents);
  readonly lastPlace = computed(() => this.state().lastPlace);

  constructor() {
    effect(() => {
      const value = this.state();
      if (!this.isBrowser) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Almacenamiento no disponible (modo privado, cuota llena): seguimos en memoria.
      }
    });
  }

  setUnits(units: Units): void {
    this.state.update((s) => ({ ...s, units }));
  }

  setLang(lang: Language): void {
    this.state.update((s) => ({ ...s, lang }));
  }

  isFavorite(place: Place): boolean {
    return this.favorites().some((p) => samePlace(p, place));
  }

  toggleFavorite(place: Place): void {
    this.state.update((s) => ({
      ...s,
      favorites: s.favorites.some((p) => samePlace(p, place))
        ? s.favorites.filter((p) => !samePlace(p, place))
        : [...s.favorites, place],
    }));
  }

  /** Registra la ciudad consultada como última y al frente de las recientes. */
  visit(place: Place): void {
    this.state.update((s) => ({
      ...s,
      lastPlace: place,
      recents: [place, ...s.recents.filter((p) => !samePlace(p, place))].slice(0, MAX_RECENTS),
    }));
  }

  private load(): StoredPrefs {
    if (!this.isBrowser) return DEFAULTS;
    // En la primera visita, el idioma se toma del navegador.
    const detected: StoredPrefs = {
      ...DEFAULTS,
      lang: navigator.language?.toLowerCase().startsWith('es') === false ? 'en' : 'es',
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...detected, ...JSON.parse(raw) } : detected;
    } catch {
      return detected;
    }
  }
}

export function samePlace(a: Place, b: Place): boolean {
  return a.id === b.id || (Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01);
}
