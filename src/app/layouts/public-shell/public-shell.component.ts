import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeaderComponent } from '../../shared/components/public/public-header/public-header.component';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, PublicHeaderComponent],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {}
