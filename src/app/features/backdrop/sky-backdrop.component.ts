import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkyTheme } from '../../core/services/weather-store.service';

const THEMES: SkyTheme[] = [
  'clear-day',
  'clear-night',
  'cloudy-day',
  'cloudy-night',
  'rain',
  'snow',
  'thunder',
  'fog',
];

/** Generador pseudoaleatorio con semilla: mismas partículas en servidor y navegador. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const rnd = seeded(42);
const STARS = Array.from({ length: 70 }, () => ({
  x: rnd() * 100,
  y: rnd() * 70,
  size: 1 + rnd() * 2,
  delay: rnd() * 4,
}));
const DROPS = Array.from({ length: 80 }, () => ({
  x: rnd() * 110 - 5,
  delay: rnd() * 1.2,
  duration: 0.55 + rnd() * 0.4,
  length: 40 + rnd() * 50,
}));
const FLAKES = Array.from({ length: 60 }, () => ({
  x: rnd() * 100,
  delay: rnd() * 10,
  duration: 7 + rnd() * 8,
  size: 3 + rnd() * 5,
}));
const CLOUDS = Array.from({ length: 5 }, (_, i) => ({
  top: 4 + i * 11 + rnd() * 6,
  scale: 0.7 + rnd() * 0.9,
  duration: 70 + rnd() * 60,
  delay: -rnd() * 120,
  opacity: 0.35 + rnd() * 0.35,
}));

/** Fondo animado a pantalla completa que refleja el clima y el momento del día. */
@Component({
  selector: 'app-sky-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  templateUrl: './sky-backdrop.component.html',
  styleUrl: './sky-backdrop.component.scss',
})
export class SkyBackdropComponent {
  readonly theme = input<SkyTheme>('clear-day');

  protected readonly themes = THEMES;
  protected readonly stars = STARS;
  protected readonly drops = DROPS;
  protected readonly flakes = FLAKES;
  protected readonly clouds = CLOUDS;

  protected readonly night = computed(() => this.theme().endsWith('night'));
  protected readonly showSun = computed(() => this.theme() === 'clear-day');
  protected readonly showStars = computed(() => this.theme() === 'clear-night' || this.theme() === 'cloudy-night');
  protected readonly showClouds = computed(() =>
    ['cloudy-day', 'cloudy-night', 'rain', 'thunder', 'fog', 'snow'].includes(this.theme()),
  );
  protected readonly showRain = computed(() => this.theme() === 'rain' || this.theme() === 'thunder');
  protected readonly showSnow = computed(() => this.theme() === 'snow');
  protected readonly showLightning = computed(() => this.theme() === 'thunder');
  protected readonly showFog = computed(() => this.theme() === 'fog');
}
