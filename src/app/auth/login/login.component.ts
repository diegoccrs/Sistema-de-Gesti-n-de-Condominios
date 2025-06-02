import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Importar para el spinner
import { MatIconModule } from '@angular/material/icon'; // Importar para el icono de error y logo

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    RouterLink,
    MatProgressSpinnerModule, // Añadido
    MatIconModule // Añadido
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  isLoading = false;
  currentYear = new Date().getFullYear(); // Para el footer dinámico

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage: string | null = null;

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Por favor, complete todos los campos requeridos y válidos.'; // Mensaje más genérico y amigable
      return;
    }

    this.isLoading = true;
    this.errorMessage = null; // Limpiar mensaje de error previo

    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password!
      });

      if (error) throw error;
      await this.handlePostLogin(data.user?.id);

    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async handlePostLogin(userId?: string) {
    try {
      // Obtener rol desde Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role) {
        // Forzar actualización de la sesión para asegurar el rol
        await supabase.auth.refreshSession();
        console.log('Rol asignado:', profile.role);
      }

      // Redirección garantizada
      this.router.navigate(['/dashboard'], { replaceUrl: true });

    } catch (error) {
      console.error('Error post-login:', error);
      // En caso de error post-login, aún redirigir al dashboard para no bloquear al usuario
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  private handleLoginError(error: any) {
    console.error('Error de login:', error);
    
    if (error.message.includes('Invalid login credentials') || error.message.includes('AuthApiError: Invalid login credentials')) {
      this.errorMessage = 'Correo o contraseña incorrectos. Por favor, verifica tus datos.';
    } else if (error.message.includes('Email not confirmed')) {
      this.errorMessage = 'Tu cuenta no ha sido confirmada. Revisa tu correo electrónico para verificarla.';
    } else if (error.message.includes('User not found')) {
      this.errorMessage = 'Usuario no encontrado. Asegúrate de haber ingresado el correo correcto.';
    } else {
      this.errorMessage = 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde.';
    }
  }
}