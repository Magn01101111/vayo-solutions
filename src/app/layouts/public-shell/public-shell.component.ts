import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../shared/components/public/public-header/public-header.component';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, PublicHeaderComponent],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {
  currentYear = new Date().getFullYear();
}
