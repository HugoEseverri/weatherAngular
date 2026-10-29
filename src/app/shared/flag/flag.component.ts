import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Bandera del país como imagen (los emojis de banderas no se ven en Windows).
 */
@Component({
  selector: 'app-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (code()) {
      <img [src]="src()" [srcset]="srcset()" [width]="width()" [height]="width() * 0.75" alt="" loading="lazy" decoding="async" />
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
    img {
      display: block;
      border-radius: 4px;
      object-fit: cover;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
    }
  `,
})
export class FlagComponent {
  readonly countryCode = input<string | undefined>();
  readonly width = input(24);

  protected readonly code = computed(() => {
    const c = this.countryCode()?.toLowerCase();
    return c && /^[a-z]{2}$/.test(c) ? c : null;
  });
  protected readonly src = computed(() => `https://flagcdn.com/w40/${this.code()}.png`);
  protected readonly srcset = computed(() => `https://flagcdn.com/w80/${this.code()}.png 2x`);
}
