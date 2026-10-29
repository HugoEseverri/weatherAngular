import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { describeCode } from '../../core/utils/weather-codes';

/** Ícono meteorológico vectorial y animado, armado a partir del código WMO. */
@Component({
  selector: 'app-weather-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[class.animated]': 'animated()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  template: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      @let k = kind();
      @if (k === 'clear') {
        @if (isDay()) {
          <g class="sun">
            <g class="rays">
              @for (r of rays; track r) {
                <line x1="32" y1="9" x2="32" y2="14" [attr.transform]="'rotate(' + r + ' 32 32)'" />
              }
            </g>
            <circle cx="32" cy="32" r="12" />
          </g>
        } @else {
          <path class="moon" d="M38 13a19 19 0 1 0 13 30 15 15 0 0 1-13-30Z" />
          <circle class="star s1" cx="49" cy="16" r="1.6" />
          <circle class="star s2" cx="54" cy="27" r="1.1" />
        }
      } @else {
        @if (k === 'partly-cloudy') {
          @if (isDay()) {
            <g class="sun small">
              <g class="rays">
                @for (r of rays; track r) {
                  <line x1="22" y1="5" x2="22" y2="9" [attr.transform]="'rotate(' + r + ' 22 20)'" />
                }
              </g>
              <circle cx="22" cy="20" r="8.5" />
            </g>
          } @else {
            <path class="moon" d="M24 6a13 13 0 1 0 9 20.5 10.5 10.5 0 0 1-9-20.5Z" />
          }
        }
        @if (k === 'cloudy' || k === 'rain' || k === 'thunder') {
          <g class="cloud back" transform="translate(-6 -6) scale(0.9)">
            <circle cx="22" cy="33" r="9" />
            <circle cx="34" cy="26" r="12" />
            <circle cx="45" cy="33" r="9" />
            <rect x="13" y="31" width="41" height="14" rx="7" />
          </g>
        }
        <g class="cloud front" [class.storm]="k === 'thunder'" [class.night]="!isDay()" [attr.transform]="cloudTransform()">
          <circle cx="22" cy="33" r="9" />
          <circle cx="34" cy="26" r="12" />
          <circle cx="45" cy="33" r="9" />
          <rect x="13" y="31" width="41" height="14" rx="7" />
        </g>

        @switch (k) {
          @case ('drizzle') {
            <g class="drops">
              <line class="d1" x1="25" y1="50" x2="24" y2="54" />
              <line class="d2" x1="37" y1="50" x2="36" y2="54" />
            </g>
          }
          @case ('rain') {
            <g class="drops">
              <line class="d1" x1="22" y1="50" x2="20" y2="56" />
              <line class="d2" x1="32" y1="50" x2="30" y2="56" />
              <line class="d3" x1="42" y1="50" x2="40" y2="56" />
            </g>
          }
          @case ('snow') {
            <g class="flakes">
              <circle class="d1" cx="22" cy="52" r="2" />
              <circle class="d2" cx="32" cy="55" r="2" />
              <circle class="d3" cx="42" cy="52" r="2" />
            </g>
          }
          @case ('thunder') {
            <polygon class="bolt" points="35,40 27,53 33,53 29,63 41,48 35,48 39,40" />
          }
          @case ('fog') {
            <g class="fog">
              <line class="d1" x1="14" y1="51" x2="50" y2="51" />
              <line class="d2" x1="20" y1="57" x2="56" y2="57" />
            </g>
          }
        }
      }
    </svg>
  `,
  styleUrl: './weather-icon.component.scss',
})
export class WeatherIconComponent {
  readonly code = input.required<number>();
  readonly isDay = input(true);
  readonly size = input(48);
  readonly animated = input(true);

  protected readonly rays = [0, 45, 90, 135, 180, 225, 270, 315];
  protected readonly kind = computed(() => describeCode(this.code()).kind);
  private readonly i18n = inject(I18nService);
  protected readonly label = computed(() => this.i18n.t(describeCode(this.code()).key));

  protected readonly cloudTransform = computed(() => {
    switch (this.kind()) {
      case 'partly-cloudy':
        return 'translate(4 6)';
      case 'cloudy':
        return 'translate(3 6)';
      default:
        return 'translate(0 0)';
    }
  });
}
