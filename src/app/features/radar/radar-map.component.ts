import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type * as Leaflet from 'leaflet';
import { I18nService } from '../../core/i18n/i18n.service';
import { formatTime } from '../../core/utils/time';
import { IconComponent } from '../../shared/icon/icon.component';

const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';
const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
const FRAME_MS = 700;
const LAST_FRAME_PAUSE_MS = 1600;

interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  host: string;
  radar: { past: RadarFrame[]; nowcast?: RadarFrame[] };
}

/** Mapa con el radar de precipitaciones de las últimas ~2 horas, animado. */
@Component({
  selector: 'app-radar-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Sin encapsulación para que los estilos de Leaflet alcancen al mapa que genera la librería
  encapsulation: ViewEncapsulation.None,
  imports: [IconComponent],
  templateUrl: './radar-map.component.html',
  styleUrl: './radar-map.component.scss',
})
export class RadarMapComponent {
  private readonly http = inject(HttpClient);
  protected readonly i18n = inject(I18nService);

  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly timezone = input.required<string>();

  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');

  protected readonly frames = signal<RadarFrame[]>([]);
  protected readonly index = signal(0);
  protected readonly playing = signal(true);
  protected readonly failed = signal(false);
  protected readonly ready = signal(false);

  protected readonly frameLabel = computed(() => {
    const frame = this.frames()[this.index()];
    if (!frame) return '';
    const minutesAgo = Math.round((Date.now() - frame.time * 1000) / 60_000);
    const time = formatTime(new Date(frame.time * 1000), this.timezone(), this.i18n.locale());
    return minutesAgo <= 5 ? `${this.i18n.t('radar.now')} · ${time}` : `${time} · ${this.i18n.t('radar.ago', { n: minutesAgo })}`;
  });

  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private marker?: Leaflet.Marker;
  private layers: Leaflet.TileLayer[] = [];
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.init();
    });

    // Recentrar el mapa al cambiar de ciudad
    effect(() => {
      const center: [number, number] = [this.latitude(), this.longitude()];
      if (!this.map) return;
      this.map.setView(center, this.map.getZoom(), { animate: true });
      this.marker?.setLatLng(center);
    });

    // Mostrar solo la capa del cuadro actual
    effect(() => {
      const i = this.index();
      this.layers.forEach((layer, j) => layer.setOpacity(i === j ? 0.75 : 0));
    });

    // Animación: avanza cuadros mientras esté en reproducción
    effect((onCleanup) => {
      if (!this.playing() || !this.ready()) return;
      const last = this.frames().length - 1;
      const delay = this.index() === last ? LAST_FRAME_PAUSE_MS : FRAME_MS;
      this.timer = setTimeout(() => this.index.update((i) => (i >= last ? 0 : i + 1)), delay);
      onCleanup(() => clearTimeout(this.timer));
    });

    destroyRef.onDestroy(() => {
      clearTimeout(this.timer);
      this.map?.remove();
    });
  }

  protected togglePlay(): void {
    this.playing.update((p) => !p);
  }

  protected seek(value: string): void {
    this.playing.set(false);
    this.index.set(Number(value));
  }

  private async init(): Promise<void> {
    try {
      const [L, data] = await Promise.all([
        import('leaflet').then((m) => (m.default ?? m) as typeof Leaflet),
        firstValueFrom(this.http.get<RainViewerResponse>(RAINVIEWER_URL)),
      ]);
      this.L = L;

      const center: [number, number] = [this.latitude(), this.longitude()];
      const map = L.map(this.container().nativeElement, {
        center,
        zoom: 6,
        minZoom: 3,
        maxZoom: 10,
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        zoomControl: true,
        attributionControl: true,
      });
      this.map = map;

      L.tileLayer(`${ESRI_URL}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 16,
        attribution: 'Esri, HERE, Garmin, &copy; OpenStreetMap · RainViewer',
      }).addTo(map);

      const frames = data.radar.past;
      this.layers = frames.map((f) =>
        L.tileLayer(`${data.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, {
          opacity: 0,
          maxNativeZoom: 7,
          maxZoom: 10,
          zIndex: 10,
        }).addTo(map),
      );

      // Etiquetas de ciudades por encima del radar para no perder la referencia
      L.tileLayer(`${ESRI_URL}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 16,
        zIndex: 20,
      }).addTo(map);

      this.marker = L.marker(center, {
        icon: L.divIcon({ className: 'radar-pin', html: '<span></span>', iconSize: [18, 18] }),
        keyboard: false,
        interactive: false,
      }).addTo(map);

      this.frames.set(frames);
      this.index.set(frames.length - 1);
      this.ready.set(true);
    } catch {
      this.failed.set(true);
    }
  }
}
