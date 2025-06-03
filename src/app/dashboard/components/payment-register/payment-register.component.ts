import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-payment-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule // <-- ADD IT HERE
  ],
  templateUrl: './payment-register.component.html',
  styleUrls: ['./payment-register.component.css']
})
export class PaymentRegisterComponent implements OnInit {
  paymentForm: FormGroup;
  isLoading: boolean = false;

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<PaymentRegisterComponent>,
  ) {
    this.paymentForm = this.fb.group({
      concept: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currency: ['VES', Validators.required],
      payment_date: [new Date(), Validators.required],
      proof_url: [''], 
      notes: [''] 
    });
  }

  ngOnInit(): void {
  }

  async onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.isLoading = false;
        this.snackBar.open('Usuario no autenticado. Por favor, inicie sesión de nuevo.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        this.dialogRef.close({ error: 'User not authenticated' });
        return;
      }

      const formValue = this.paymentForm.value;
      const paymentData = {
        resident_id: user.id,
        concept: formValue.concept,
        amount: formValue.amount,
        currency: formValue.currency,
        payment_date: new Date(formValue.payment_date).toISOString(),
        status: 'pending',
        reported_at: new Date().toISOString(),
        proof_url: formValue.proof_url || null,
        notes: formValue.notes || null,
      };

      const { error } = await supabase.from('payments').insert([paymentData]);

      this.isLoading = false;
      if (error) {
        console.error('Error al registrar el pago:', error);
        this.snackBar.open(`Error al registrar el pago: ${error.message}`, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        this.dialogRef.close({ error: error.message });
      } else {
        this.dialogRef.close({ success: true });
      }
    } catch (e) {
      this.isLoading = false;
      console.error('Error inesperado en onSubmit:', e);
      this.snackBar.open('Ocurrió un error inesperado.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
      this.dialogRef.close({ error: 'Unexpected error' });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}