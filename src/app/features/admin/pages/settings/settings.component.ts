import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { CompanyService } from '../../../../core/services/company.service';
import { ApiCompany }     from '../../../../core/models/api.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly companySvc = inject(CompanyService);

  loading = true;
  saving  = false;
  error   = '';
  success = '';

  // Form
  ivaPercent: number  = 19;
  name: string        = '';
  rut: string         = '';
  address: string     = '';
  phone: string       = '';
  email: string       = '';
  website: string     = '';
  invoiceTerms: string = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.companySvc.getCompany().subscribe({
      next: (res) => {
        const c = res.data;
        this.ivaPercent   = c.ivaPercent ?? 19;
        this.name         = c.name ?? '';
        this.rut          = c.rut ?? '';
        this.address      = c.address ?? '';
        this.phone        = c.phone ?? '';
        this.email        = c.email ?? '';
        this.website      = c.website ?? '';
        this.invoiceTerms = c.invoiceTerms ?? '';
        this.loading      = false;
      },
      error: () => {
        this.error   = 'No se pudo cargar la configuración.';
        this.loading = false;
      },
    });
  }

  save(): void {
    this.success = '';
    this.error   = '';

    if (this.ivaPercent < 0 || this.ivaPercent > 100) {
      this.error = 'El IVA debe estar entre 0 y 100.';
      return;
    }

    this.saving = true;
    const payload: Partial<ApiCompany> = {
      ivaPercent:   Number(this.ivaPercent),
      name:         this.name.trim(),
      rut:          this.rut.trim()         || undefined,
      address:      this.address.trim()     || undefined,
      phone:        this.phone.trim()       || undefined,
      email:        this.email.trim()       || undefined,
      website:      this.website.trim()     || undefined,
      invoiceTerms: this.invoiceTerms.trim() || undefined,
    };

    this.companySvc.updateCompany(payload).subscribe({
      next: () => {
        this.saving  = false;
        this.success = 'Configuración guardada correctamente.';
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err) => {
        this.saving = false;
        this.error  = err?.error?.error ?? 'No se pudo guardar la configuración.';
      },
    });
  }
}
