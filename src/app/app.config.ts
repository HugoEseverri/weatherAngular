import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { serverCacheInterceptor } from './core/services/server-cache.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([serverCacheInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Con SSR, la navegación inicial bloqueante asegura que la página reutilice los datos del servidor
      withEnabledBlockingInitialNavigation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Hidratación incremental: las secciones bajo el pliegue cargan su JS al llegar a la pantalla
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
