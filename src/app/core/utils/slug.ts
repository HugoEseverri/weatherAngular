import { Place } from '../models/weather.models';

export type PlaceRef = { kind: 'id'; id: string } | { kind: 'coords'; latitude: number; longitude: number };

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Segmento de URL de una ciudad:
 * - con id de GeoNames: `olavarria-3842670` (legible y estable)
 * - solo coordenadas (geolocalización): `@-36.8938,-60.3232`
 */
export function placeSlug(place: Place): string {
  if (/^\d+$/.test(place.id)) {
    const name = slugify(place.name);
    return name ? `${name}-${place.id}` : place.id;
  }
  return `@${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`;
}

export function parseSlug(slug: string): PlaceRef | null {
  const id = /(?:^|-)(\d+)$/.exec(slug);
  if (id) return { kind: 'id', id: id[1] };

  const coords = /^@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/.exec(decodeURIComponent(slug));
  if (coords) {
    const latitude = Number(coords[1]);
    const longitude = Number(coords[2]);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { kind: 'coords', latitude, longitude };
  }
  return null;
}
