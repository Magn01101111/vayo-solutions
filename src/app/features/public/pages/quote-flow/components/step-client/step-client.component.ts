import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import { QuotationService } from '../../../../../../core/services/quotation.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { CustomerType } from '../../../../../../core/models/app.models';
import { IconComponent } from '../../../../../../shared/components/icon/icon.component';
import { CHILE_REGIONS, communesForRegion } from '../../../../../../core/data/chile-locations.data';

/** Valida RUT chileno con dígito verificador (formato 12.345.678-K). */
function rutValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = (ctrl.value ?? '').toString().replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!value) return null;
  if (!/^\d{7,8}[0-9K]$/.test(value)) return { rut: 'Formato inválido' };

  const body = value.slice(0, -1);
  const dv = value.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);

  return expected === dv ? null : { rut: 'RUT no válido' };
}

function formatRut(raw: string): string {
  const clean = raw.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return clean;
  const reversed = body.split('').reverse().join('');
  const grouped = reversed.match(/.{1,3}/g)?.join('.').split('').reverse().join('') ?? body;
  return `${grouped}-${dv}`;
}

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

@Component({
  selector: 'app-step-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './step-client.component.html',
  styleUrl: './step-client.component.scss',
})
export class StepClientComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly qs = inject(QuotationService);
  readonly auth = inject(AuthService);

  regions = CHILE_REGIONS.length ? CHILE_REGIONS : REGIONS.map((name) => ({ name, communes: [] }));
  billingRegion = signal('Metropolitana');
  shippingRegion = signal('Metropolitana');
  billingCommunes = computed(() => communesForRegion(this.billingRegion()));
  shippingCommunes = computed(() => communesForRegion(this.shippingRegion()));
  customerType = signal<CustomerType>('person');

  /**
   * Controla si ya se eligió cómo continuar.
   *   - 'choosing': muestra la pantalla "iniciar sesión / invitado" (solo anónimos)
   *   - 'guest'   : muestra el formulario de datos
   * Los usuarios logueados saltan directo a 'guest' con datos precargados.
   */
  mode = signal<'choosing' | 'guest'>('choosing');

  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated;
  }

  form = this.fb.nonNullable.group({
    customerType: this.fb.nonNullable.control<CustomerType>('person'),
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9 +()-]{8,}$/)]],
    company: [''],
    taxId: ['', [rutValidator]],
    businessActivity: [''],

    billingStreet: ['', [Validators.required]],
    billingNumber: ['', [Validators.required]],
    billingApt: [''],
    billingCity: ['', [Validators.required]],
    billingRegion: ['Metropolitana', [Validators.required]],
    billingZip: [''],
    billingReference: [''],

    shippingSameAsBilling: [true],
    shippingStreet: [''],
    shippingNumber: [''],
    shippingApt: [''],
    shippingCity: [''],
    shippingRegion: ['Metropolitana'],
    shippingZip: [''],
    shippingReference: [''],

    notes: [''],
    acceptsTerms: [false, [Validators.requiredTrue]],
    acceptsMarketing: [false],
  });

  ngOnInit(): void {
    const client = this.qs.client();

    // Decidir el modo inicial:
    //  - Si hay sesión → saltar la elección, precargar datos del usuario.
    //  - Si ya completó datos antes (volvió atrás) → ir directo al formulario.
    //  - Si es anónimo y aún no eligió → mostrar pantalla de elección.
    if (this.isLoggedIn) {
      this.mode.set('guest');
      this.prefillFromAuthUser();
    } else if (client) {
      this.mode.set('guest');
    }

    if (client) {
      this.customerType.set(client.customerType ?? 'person');
      this.form.patchValue({
        customerType: client.customerType ?? 'person',
        name: client.name ?? '',
        email: client.email ?? '',
        phone: client.phone ?? '',
        company: client.company ?? '',
        taxId: client.taxId ?? '',
        businessActivity: client.businessActivity ?? '',
        billingStreet: client.billingAddress?.street ?? '',
        billingNumber: client.billingAddress?.number ?? '',
        billingApt: client.billingAddress?.apt ?? '',
        billingCity: client.billingAddress?.city ?? '',
        billingRegion: client.billingAddress?.region ?? 'Metropolitana',
        billingZip: client.billingAddress?.zip ?? '',
        billingReference: client.billingAddress?.reference ?? '',
        shippingSameAsBilling: client.shippingSameAsBilling ?? true,
        shippingStreet: client.shippingAddress?.street ?? '',
        shippingNumber: client.shippingAddress?.number ?? '',
        shippingApt: client.shippingAddress?.apt ?? '',
        shippingCity: client.shippingAddress?.city ?? '',
        shippingRegion: client.shippingAddress?.region ?? 'Metropolitana',
        shippingZip: client.shippingAddress?.zip ?? '',
        shippingReference: client.shippingAddress?.reference ?? '',
        notes: client.notes ?? '',
        acceptsTerms: client.acceptsTerms ?? false,
        acceptsMarketing: client.acceptsMarketing ?? false,
      });
    }

    this.wireAddressSelects();
    this.applyCustomerTypeRules(this.customerType());

    this.form.controls.shippingSameAsBilling.valueChanges.subscribe((same) => {
      this.applyShippingValidators(!same);
    });
  }

  /** El usuario eligió continuar sin cuenta. */
  continueAsGuest(): void {
    this.mode.set('guest');
  }

  /** Lleva al login, recordando volver a la cotización después. */
  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { redirect: '/cotizacion' } });
  }

  /** Precarga nombre/email/teléfono del usuario logueado (el resto lo completa él). */
  private prefillFromAuthUser(): void {
    const u = this.auth.currentUser;
    if (!u) return;
    this.form.patchValue({
      name: u.name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
    });
  }

  setCustomerType(t: CustomerType) {
    this.customerType.set(t);
    this.form.controls.customerType.setValue(t);
    this.applyCustomerTypeRules(t);
  }

  private applyCustomerTypeRules(t: CustomerType) {
    const { company, businessActivity, taxId } = this.form.controls;
    if (t === 'company') {
      company.setValidators([Validators.required, Validators.minLength(2)]);
      taxId.setValidators([Validators.required, rutValidator]);
    } else {
      company.clearValidators();
      taxId.setValidators([rutValidator]);
    }
    company.updateValueAndValidity({ emitEvent: false });
    taxId.updateValueAndValidity({ emitEvent: false });
    businessActivity.updateValueAndValidity({ emitEvent: false });
  }

  private applyShippingValidators(required: boolean) {
    const fields = ['shippingStreet', 'shippingNumber', 'shippingCity', 'shippingRegion'] as const;
    fields.forEach((f) => {
      const ctrl = this.form.controls[f];
      ctrl.setValidators(required ? [Validators.required] : null);
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private wireAddressSelects(): void {
    this.billingRegion.set(this.form.controls.billingRegion.value);
    this.shippingRegion.set(this.form.controls.shippingRegion.value);
    this.clearCommuneIfNotInRegion('billingCity', this.form.controls.billingRegion.value);
    this.clearCommuneIfNotInRegion('shippingCity', this.form.controls.shippingRegion.value);

    this.form.controls.billingRegion.valueChanges.subscribe((region) => {
      this.billingRegion.set(region);
      this.clearCommuneIfNotInRegion('billingCity', region);
    });

    this.form.controls.shippingRegion.valueChanges.subscribe((region) => {
      this.shippingRegion.set(region);
      this.clearCommuneIfNotInRegion('shippingCity', region);
    });
  }

  private clearCommuneIfNotInRegion(controlName: 'billingCity' | 'shippingCity', region: string): void {
    const communes = communesForRegion(region);
    const ctrl = this.form.controls[controlName];
    if (ctrl.value && !communes.includes(ctrl.value)) {
      ctrl.setValue('', { emitEvent: false });
    }
  }

  formatRutOnBlur() {
    const value = this.form.controls.taxId.value;
    if (value) {
      this.form.controls.taxId.setValue(formatRut(value), { emitEvent: false });
    }
  }

  copyBillingToShipping() {
    const v = this.form.value;
    this.form.patchValue({
      shippingStreet: v.billingStreet ?? '',
      shippingNumber: v.billingNumber ?? '',
      shippingApt: v.billingApt ?? '',
      shippingCity: v.billingCity ?? '',
      shippingRegion: v.billingRegion ?? 'Metropolitana',
      shippingZip: v.billingZip ?? '',
      shippingReference: v.billingReference ?? '',
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  errorOf(controlName: string): string | null {
    const ctrl = this.form.get(controlName);
    if (!ctrl?.errors) return null;
    if (ctrl.errors['required'] || ctrl.errors['requiredTrue']) return 'Campo requerido';
    if (ctrl.errors['email']) return 'Email no válido';
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['pattern']) return 'Formato no válido';
    if (ctrl.errors['rut']) return ctrl.errors['rut'];
    return 'Valor no válido';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = document.querySelector('.input.ng-invalid') as HTMLInputElement | null;
      firstInvalid?.focus();
      return;
    }

    const v = this.form.getRawValue();
    this.qs.setClient({
      customerType: v.customerType,
      name: v.name,
      email: v.email,
      phone: v.phone || undefined,
      company: v.company || undefined,
      taxId: v.taxId || undefined,
      businessActivity: v.businessActivity || undefined,
      billingAddress: {
        street: v.billingStreet,
        number: v.billingNumber,
        apt: v.billingApt || undefined,
        city: v.billingCity,
        region: v.billingRegion,
        zip: v.billingZip || undefined,
        reference: v.billingReference || undefined,
      },
      shippingAddress: v.shippingSameAsBilling
        ? undefined
        : {
            street: v.shippingStreet,
            number: v.shippingNumber,
            apt: v.shippingApt || undefined,
            city: v.shippingCity,
            region: v.shippingRegion,
            zip: v.shippingZip || undefined,
            reference: v.shippingReference || undefined,
          },
      shippingSameAsBilling: v.shippingSameAsBilling,
      notes: v.notes || undefined,
      acceptsTerms: v.acceptsTerms,
      acceptsMarketing: v.acceptsMarketing,
    });
    this.qs.nextStep();
  }

  back() {
    this.qs.prevStep();
  }
}
