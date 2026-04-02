import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { QuotationService } from '../../../../../../core/services/quotation.service';

@Component({
  selector: 'app-step-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-client.component.html',
  styleUrl: './step-client.component.scss',
})
export class StepClientComponent implements OnInit {

  private fb = inject(FormBuilder);
  readonly qs = inject(QuotationService);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    notes: ['']
  });

  ngOnInit(): void {
    const client = this.qs.client();

    if (client) {
      this.form.patchValue(client);
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.qs.setClient(this.form.getRawValue());
    this.qs.nextStep();
  }

  back() {
    this.qs.prevStep();
  }

  // helpers UI
  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && control.touched;
  }
}
