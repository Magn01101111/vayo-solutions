import { Component, input, output } from '@angular/core';

/**
 * Stepper [−] n [+] reutilizable.
 * Uso: <vayo-quantity-stepper [value]="qty" [min]="1" [max]="999"
 *                             (valueChange)="qty = $event" />
 */
@Component({
  selector: 'vayo-quantity-stepper',
  standalone: true,
  template: `
    <div class="stepper" role="group" [attr.aria-label]="label()">
      <button
        type="button"
        class="stepper__btn"
        [disabled]="value() <= min()"
        aria-label="Disminuir cantidad"
        (click)="change(-1)"
      >−</button>

      <input
        type="number"
        class="stepper__input"
        [min]="min()"
        [max]="max()"
        [value]="value()"
        (input)="onInput($any($event.target).value)"
        aria-label="Cantidad"
      />

      <button
        type="button"
        class="stepper__btn"
        [disabled]="value() >= max()"
        aria-label="Aumentar cantidad"
        (click)="change(1)"
      >+</button>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .stepper {
      display: flex; align-items: center;
      border: var(--bw) solid var(--line); border-radius: var(--r-xs); overflow: hidden;
      background: var(--paper);
    }
    .stepper__btn {
      width: 32px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none;
      font-size: 17px; font-weight: var(--fw-medium); color: var(--ink-2);
      cursor: pointer; transition: background var(--t-fast), color var(--t-fast);

      &:hover:not(:disabled) { background: var(--blue-50); color: var(--blue); }
      &:disabled { opacity: .35; cursor: not-allowed; }
    }
    .stepper__input {
      width: 44px; height: 36px; padding: 0; border: none;
      border-left: var(--bw) solid var(--line-2);
      border-right: var(--bw) solid var(--line-2);
      text-align: center;
      font-family: var(--font-mono); font-size: var(--fs-sm);
      font-weight: var(--fw-semibold); color: var(--ink);
      background: var(--paper); -moz-appearance: textfield;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      &:focus { outline: none; background: var(--blue-50); box-shadow: var(--focus-shadow); }
    }
  `],
})
export class VayoQuantityStepperComponent {
  readonly value       = input.required<number>();
  readonly min         = input<number>(1);
  readonly max         = input<number>(9999);
  readonly label       = input<string>('Cantidad');
  readonly valueChange = output<number>();

  change(delta: number): void {
    const next = Math.min(this.max(), Math.max(this.min(), this.value() + delta));
    if (next !== this.value()) this.valueChange.emit(next);
  }

  onInput(raw: string): void {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    this.valueChange.emit(Math.min(this.max(), Math.max(this.min(), n)));
  }
}
