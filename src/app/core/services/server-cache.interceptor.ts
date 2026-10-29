import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, of, tap } from 'rxjs';

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 300;
const CACHEABLE = /^https:\/\/([a-z-]+\.)?open-meteo\.com\/|^https:\/\/api\.bigdatacloud\.net\//;

/** Caché en memoria compartida entre renderizados del mismo proceso del servidor. */
const cache = new Map<string, { expires: number; response: HttpResponse<unknown> }>();

/**
 * Solo en el servidor: reutiliza durante 10 minutos las respuestas de las APIs del clima,
 * así renderizar una ciudad ya consultada no espera otra vez a la red.
 */
export const serverCacheInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  if (!isPlatformServer(inject(PLATFORM_ID)) || req.method !== 'GET' || !CACHEABLE.test(req.url)) {
    return next(req);
  }

  const key = req.urlWithParams;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return of(hit.response.clone());

  return next(req).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse) || !event.ok) return;
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.now() + TTL_MS, response: event });
    }),
  );
};
