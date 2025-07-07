import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  fb = inject(FormBuilder);
  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  message: string | null = null;
  errorMessage: string | null = null;

  async sendResetLink() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      this.errorMessage = 'Ingrese un correo válido.';
      return;
    }

    this.errorMessage = null;
    const { email } = this.resetForm.value;

    const { error } = await supabase.auth.resetPasswordForEmail(email!, {
      redirectTo: 'http://localhost:4200/auth/reset-password' // Cambia esto si estás en producción
    });

    if (error) {
      this.errorMessage = 'Error al enviar el enlace: ' + error.message;
    } else {
      this.message = 'Se ha enviado un enlace a su correo para restablecer la contraseña.';
    }
  }
}