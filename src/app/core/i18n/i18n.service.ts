import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import { Language } from '../models/weather.models';
import { PreferencesService } from '../services/preferences.service';
import { en } from './en';
import { Dictionary, es, TranslationKey } from './es';

const DICTIONARIES: Record<Language, Dictionary> = { es, en };
const LOCALES: Record<Language, string> = { es: 'es-AR', en: 'en-US' };

/**
 * Traducciones en tiempo de ejecución. Como `t()` lee una señal, cualquier plantilla
 * que la use se vuelve a renderizar sola al cambiar de idioma.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly prefs = inject(PreferencesService);

  readonly lang = this.prefs.lang;
  readonly locale = computed(() => LOCALES[this.lang()]);
  private readonly dict = computed(() => DICTIONARIES[this.lang()]);

  constructor() {
    const doc = inject(DOCUMENT);
    effect(() => doc.documentElement.setAttribute('lang', this.lang()));
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text = this.dict()[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) text = text.replace(`{${name}}`, String(value));
    }
    return text;
  }

  setLang(lang: Language): void {
    this.prefs.setLang(lang);
  }

  number(value: number, maxFractionDigits = 1): string {
    return new Intl.NumberFormat(this.locale(), { maximumFractionDigits: maxFractionDigits }).format(value);
  }
}
