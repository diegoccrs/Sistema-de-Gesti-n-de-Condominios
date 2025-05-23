// src/app/auth/forgot-password.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  fb = inject(FormBuilder);
  router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  message: string | null = null;
  error: string | null = null;
  isSubmitting = false;

  async submit() {
    this.message = null;
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { email } = this.form.value;

    const { error } = await supabase.auth.resetPasswordForEmail(email!, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    this.isSubmitting = false;

    if (error) {
      console.error(error);
      this.error = 'Error al enviar el correo. Intente de nuevo.';
    } else {
      this.message = 'Revisa tu correo electrónico para restablecer tu contraseña.';
    }
  }
}