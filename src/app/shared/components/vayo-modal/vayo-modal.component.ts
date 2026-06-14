import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Dialog reutilizable "Industrial Marcado".
 * Uso: <vayo-modal [open]="flag" (close)="flag=false" title="…">
 *   <!-- body -->
 *   <ng-container slot="footer"><!-- foot opcional --></ng-container>
 * </vayo-modal>
 */
@Component({
  selector: 'vayo-modal',
  standalone: true,
  templateUrl: './vayo-modal.component.html',
  styleUrl: './vayo-modal.component.scss',
})
export class VayoModalComponent {
  readonly open  = input<boolean>(false);
  readonly title = input<string>('');
  readonly size  = input<'sm' | 'md' | 'lg'>('md');
  readonly close = output<void>();

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => {
      // noop — el trap de foco se gestiona con tabindex + CSS
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('vm-backdrop')) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close.emit();
  }
}
