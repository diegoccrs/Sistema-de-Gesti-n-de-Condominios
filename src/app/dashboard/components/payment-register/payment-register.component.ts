import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { createClient } from '@supabase/supabase-js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';


const supabaseUrl = 'https://rimuwztixsaxiaznzfdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc';
const supabase = createClient(supabaseUrl, supabaseKey);

@Component({
  selector: 'app-payment-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule],
  templateUrl: './payment-register.component.html',
  providers: [FormBuilder],
})
export class PaymentRegisterComponent {
  paymentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PaymentRegisterComponent>,
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, Validators.required],
      currency: ['VES', Validators.required],
      payment_date: ['', Validators.required],
    });
  }

  async onSubmit() {
    if (this.paymentForm.valid) {
      // Obtén el usuario logueado automáticamente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuario no autenticado. Por favor inicia sesión de nuevo.');
        return;
      }

      const { amount, currency, payment_date } = this.paymentForm.value;

      const { error } = await supabase
        .from('payments')
        .insert([{
          amount,
          currency,
          payment_date,
          resident_id: user.id, // Lo toma automático
          status: 'pending',
          reported_at: new Date().toISOString(),
        }]);
      if (error) {
        alert('Error al registrar el pago');
        console.error(error);
      } else {
        alert('Pago registrado correctamente');
        this.paymentForm.reset();
        this.dialogRef.close();
      }
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}




