import { TestBed } from '@angular/core/testing';
import { Place } from '../models/weather.models';
import { PreferencesService } from './preferences.service';
import { UnitsService } from './units.service';

const city = (id: string, lat = Number(id)): Place => ({ id, name: `Ciudad ${id}`, latitude: lat, longitude: lat });

describe('PreferencesService', () => {
  let prefs: PreferencesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    prefs = TestBed.inject(PreferencesService);
  });

  afterEach(() => localStorage.clear());

  it('agrega y quita favoritos', () => {
    prefs.toggleFavorite(city('1'));
    expect(prefs.isFavorite(city('1'))).toBeTrue();

    prefs.toggleFavorite(city('1'));
    expect(prefs.favorites()).toEqual([]);
  });

  it('mantiene las recientes sin duplicados, la última primero y con límite', () => {
    for (let i = 1; i <= 8; i++) prefs.visit(city(String(i)));
    prefs.visit(city('5'));

    const ids = prefs.recents().map((p) => p.id);
    expect(ids[0]).toBe('5');
    expect(ids.length).toBe(6);
    expect(new Set(ids).size).toBe(ids.length);
    expect(prefs.lastPlace()?.id).toBe('5');
  });

  it('persiste las preferencias en localStorage', () => {
    prefs.setUnits('imperial');
    TestBed.flushEffects();
    expect(JSON.parse(localStorage.getItem('clima:prefs:v1')!).units).toBe('imperial');
  });
});

describe('UnitsService', () => {
  let prefs: PreferencesService;
  let units: UnitsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    prefs = TestBed.inject(PreferencesService);
    units = TestBed.inject(UnitsService);
  });

  it('formatea en sistema métrico por defecto', () => {
    expect(units.temp(21.6)).toBe('22°');
    expect(units.speed(10.4)).toBe('10 km/h');
    expect(units.distance(46060)).toEqual({ value: '46', unit: 'km' });
  });

  it('convierte al sistema imperial', () => {
    prefs.setUnits('imperial');
    expect(units.temp(0)).toBe('32°');
    expect(units.tempUnit()).toBe('°F');
    expect(units.speed(100)).toBe('62 mph');
  });
});
