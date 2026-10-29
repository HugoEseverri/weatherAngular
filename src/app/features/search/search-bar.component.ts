import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { Place } from '../../core/models/weather.models';
import { GeocodingService } from '../../core/services/geocoding.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { FlagComponent } from '../../shared/flag/flag.component';
import { IconComponent } from '../../shared/icon/icon.component';

interface Option {
  place: Place;
  group: 'result' | 'favorite' | 'recent';
}

interface SearchState {
  loading: boolean;
  results: Place[];
}

@Component({
  selector: 'app-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlagComponent, IconComponent],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  host: {
    '(document:keydown)': 'onGlobalKey($event)',
    '(document:pointerdown)': 'onOutsideClick($event)',
  },
})
export class SearchBarComponent {
  private readonly geocoding = inject(GeocodingService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly prefs = inject(PreferencesService);

  readonly locating = input(false);
  readonly selected = output<Place>();
  readonly locate = output<void>();

  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);

  private readonly search = toSignal(
    toObservable(this.query).pipe(
      map((q) => q.trim()),
      debounceTime(220),
      distinctUntilChanged(),
      switchMap((q) =>
        q.length < 2
          ? of<SearchState>({ loading: false, results: [] })
          : this.geocoding.search(q).pipe(
              map((results): SearchState => ({ loading: false, results })),
              catchError(() => of<SearchState>({ loading: false, results: [] })),
              startWith<SearchState>({ loading: true, results: [] }),
            ),
      ),
    ),
    { initialValue: { loading: false, results: [] } as SearchState },
  );

  protected readonly typing = computed(() => this.query().trim().length >= 2);
  protected readonly loading = computed(() => this.typing() && this.search().loading);

  /** Opciones visibles: resultados al escribir; favoritos y recientes con el campo vacío. */
  protected readonly options = computed<Option[]>(() => {
    if (this.typing()) {
      return this.search().results.map((place) => ({ place, group: 'result' }));
    }
    const favorites = this.prefs.favorites();
    const recents = this.prefs
      .recents()
      .filter((r) => !favorites.some((f) => f.id === r.id))
      .slice(0, 4);
    return [
      ...favorites.map((place) => ({ place, group: 'favorite' as const })),
      ...recents.map((place) => ({ place, group: 'recent' as const })),
    ];
  });

  protected readonly showPanel = computed(
    () => this.open() && (this.typing() || this.options().length > 0),
  );

  protected onInput(value: string): void {
    this.query.set(value);
    this.open.set(true);
    this.activeIndex.set(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        if (count) this.activeIndex.update((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) this.activeIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter': {
        const option = this.options()[Math.max(this.activeIndex(), 0)];
        if (option) {
          event.preventDefault();
          this.choose(option.place);
        }
        break;
      }
      case 'Escape':
        this.close();
        this.inputEl().nativeElement.blur();
        break;
    }
  }

  protected choose(place: Place): void {
    this.selected.emit(place);
    this.query.set('');
    this.close();
    this.inputEl().nativeElement.blur();
  }

  protected clear(): void {
    this.query.set('');
    this.inputEl().nativeElement.focus();
  }

  protected subtitle(place: Place): string {
    return [place.region, place.country].filter(Boolean).join(', ');
  }


  protected onGlobalKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typingElsewhere = target?.closest('input, textarea, [contenteditable]');
    if ((event.key === '/' && !typingElsewhere) || (event.key === 'k' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      this.inputEl().nativeElement.focus();
      this.open.set(true);
    }
  }

  protected onOutsideClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }
}
