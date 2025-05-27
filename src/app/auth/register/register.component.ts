import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  router = inject(Router);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator() });

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor() {
    this.registerForm.valueChanges.subscribe(() => {
      if (this.registerForm.hasError('mismatch')) {
        this.registerForm.controls['confirmPassword'].setErrors({ mismatch: true });
      } else {
        const confirmControl = this.registerForm.controls['confirmPassword'];
        if (confirmControl.errors?.['mismatch']) {
          delete confirmControl.errors['mismatch'];
          confirmControl.updateValueAndValidity();
        }
      }
    });
  }

  async register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    const { email, password } = this.registerForm.value;

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email!,
        password: password!,
        options: {
          data: {
            first_name: this.registerForm.value.firstName,
            last_name: this.registerForm.value.lastName
          }
        }
      });

      if (signUpError) {
        this.handleSignUpError(signUpError);
        return;
      }

      this.successMessage = 'Usuario registrado exitosamente. Por favor, verifique su correo electrónico para activar su cuenta.';
      this.registerForm.reset();

    } catch (err: any) {
      console.error('Error durante el registro:', err);
      this.errorMessage = 'Ocurrió un error inesperado durante el registro. Inténtelo de nuevo.';
    }
  }

  private handleSignUpError(error: any) {
    console.error('Error de registro:', error);
    if (error.message.includes('User already registered')) {
      this.errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicie sesión o use otro correo.';
    } else {
      this.errorMessage = 'Error al registrar el usuario: ' + error.message;
    }
  }
}