import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { I18nService } from './core/i18n/i18n.service';
import { Language, Place, Units } from './core/models/weather.models';
import { PreferencesService } from './core/services/preferences.service';
import { WeatherStore } from './core/services/weather-store.service';
import { placeSlug } from './core/utils/slug';
import { SkyBackdropComponent } from './features/backdrop/sky-backdrop.component';
import { SearchBarComponent } from './features/search/search-bar.component';
import { IconComponent } from './shared/icon/icon.component';

const AUTO_REFRESH_MS = 15 * 60 * 1000;

/** Evento no estándar que Chrome/Edge emiten cuando la app se puede instalar. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, SkyBackdropComponent, SearchBarComponent, IconComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly store = inject(WeatherStore);
  protected readonly prefs = inject(PreferencesService);
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly swUpdate = inject(SwUpdate);

  protected readonly unitOptions: { value: Units; label: string }[] = [
    { value: 'metric', label: '°C' },
    { value: 'imperial', label: '°F' },
  ];
  protected readonly langOptions: { value: Language; label: string }[] = [
    { value: 'es', label: 'ES' },
    { value: 'en', label: 'EN' },
  ];

  protected readonly online = signal(true);
  protected readonly updateReady = signal(false);
  protected readonly installPrompt = signal<InstallPromptEvent | null>(null);

  /** Un error con datos ya visibles se muestra como aviso, sin ocultar el pronóstico. */
  protected readonly softError = computed(() => {
    const key = this.store.error();
    return key && this.store.report() ? this.i18n.t(key) : null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((e) => e.type === 'VERSION_READY'),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.updateReady.set(true));
    }

    afterNextRender(() => {
      this.online.set(navigator.onLine);
      const setOnline = () => this.online.set(true);
      const setOffline = () => this.online.set(false);
      const onInstallable = (e: Event) => {
        e.preventDefault();
        this.installPrompt.set(e as InstallPromptEvent);
      };
      const onInstalled = () => this.installPrompt.set(null);
      window.addEventListener('online', setOnline);
      window.addEventListener('offline', setOffline);
      window.addEventListener('beforeinstallprompt', onInstallable);
      window.addEventListener('appinstalled', onInstalled);

      const id = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine) this.store.refresh();
      }, AUTO_REFRESH_MS);

      destroyRef.onDestroy(() => {
        clearInterval(id);
        window.removeEventListener('online', setOnline);
        window.removeEventListener('offline', setOffline);
        window.removeEventListener('beforeinstallprompt', onInstallable);
        window.removeEventListener('appinstalled', onInstalled);
      });
    });
  }

  protected select(place: Place): void {
    this.router.navigate(['/clima', placeSlug(place)], { state: { place } });
  }

  protected async locate(): Promise<void> {
    const place = await this.store.locate();
    if (place) this.select(place);
  }

  protected async install(): Promise<void> {
    const prompt = this.installPrompt();
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    this.installPrompt.set(null);
  }

  protected reload(): void {
    document.location.reload();
  }
}
