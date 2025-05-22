import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Módulos de Angular Material
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // Asegúrate de que la ruta sea correcta

// Inicialización de Supabase
// Usamos la 'anon public key' aquí, ya que es para operaciones del lado del cliente.
const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

// Custom Validator para comparar contraseñas (sin cambios)
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }
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

  async register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    const { email, password } = this.registerForm.value; // Ya no necesitamos first_name, last_name aquí para el signUp inicial

    try {
      console.log('Intentando registrar usuario en Supabase Auth...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email!,
        password: password!,
        // Podemos pasar los metadatos aquí si queremos que estén disponibles en el hook de post-confirmación
        options: {
          data: {
            first_name: this.registerForm.value.firstName, // Guardar en user_metadata
            last_name: this.registerForm.value.lastName
          }
        }
      });

      if (signUpError) {
        console.error('ERROR (Auth SignUp):', signUpError);
        if (signUpError.message.includes('User already registered')) {
            this.errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicie sesión o use otro correo.';
        } else {
            this.errorMessage = 'Error al registrar el usuario: ' + signUpError.message;
        }
        return;
      }

      // Si el registro fue exitoso (signUpData.user existe)
      // Ahora, la aplicación solo informa al usuario que debe confirmar su correo.
      console.log('✅ Usuario registrado exitosamente en Supabase Auth. Esperando confirmación de email.');
      this.successMessage = 'Usuario registrado exitosamente. Por favor, verifique su correo electrónico para activar su cuenta.';
      
      // Limpiar el formulario
      this.registerForm.reset();
      // Opcional: Redirigir a una página que les diga que verifiquen el correo
      // this.router.navigate(['/auth/check-email']); 

    } catch (err: any) {
      console.error('🔴 EXCEPCIÓN INESPERADA durante el registro:', err);
      this.errorMessage = 'Ocurrió un error inesperado durante el registro. Inténtelo de nuevo.';
    }
  }
}