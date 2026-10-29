import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // La portada no depende de datos: se genera una sola vez al compilar.
  { path: '', renderMode: RenderMode.Prerender },
  // Cada ciudad se renderiza en el servidor con el pronóstico real, para que buscadores
  // y vistas previas al compartir (WhatsApp, LinkedIn…) muestren su clima.
  { path: 'clima/:slug', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];
