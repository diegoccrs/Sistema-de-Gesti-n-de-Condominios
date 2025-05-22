// src/app/auth/login.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // <-- ¡Añadir Router y RouterLink!

// Módulos de Angular Material: ¡Asegúrate de que todos estos estén importados!
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'; // <-- Necesario para mat-card, mat-card-header, etc.
import { MatFormFieldModule } from '@angular/material/form-field'; // <-- A menudo necesario con mat-input

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // Ruta correcta

// --- Inicialización de Supabase: ¡Únicamente desde environment! ---
// Elimina las líneas `const supabaseUrl = '...'` y `const supabaseKey = '...'`
const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ // <-- ¡Este array es la clave!
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,        // Para <mat-card>
    MatFormFieldModule,   // Para <mat-form-field>
    RouterLink            // Para la directiva routerLink en el HTML ("¿Olvidaste tu contraseña?")
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  fb = inject(FormBuilder);
  router = inject(Router); // Inyecta el Router para la navegación

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage: string | null = null; // Variable para mostrar mensajes de error al usuario

  constructor() {
    // Esto es para manejar redirecciones si el usuario ya está autenticado al cargar el componente
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        console.log('Usuario ya autenticado. Redirigiendo...');
        await this.redirectToDashboard(session.user?.id);
      }
    });
  }

  async login() {
    // Marcar todos los campos como "touched" para que las validaciones se muestren inmediatamente
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      return;
    }

    this.errorMessage = null; // Limpiar mensaje de error previo

    const { email, password } = this.loginForm.value;
    try {
      // Intenta iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password!
      });

      if (error) {
        // Manejo de errores específicos de Supabase
        console.error('Error de inicio de sesión:', error);
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          this.errorMessage = 'Credenciales inválidas o correo no confirmado. Por favor, verifique sus datos.';
        } else {
          this.errorMessage = 'Ocurrió un error al iniciar sesión: ' + error.message;
        }
        return; // Detener la ejecución si hay un error
      }

      // Si el inicio de sesión fue exitoso, redirigir según el rol
      if (data.user) {
        console.log('Inicio de sesión exitoso. Obteniendo rol...');
        await this.redirectToDashboard(data.user.id);
      } else {
        this.errorMessage = 'Inicio de sesión exitoso, pero no se pudo obtener información del usuario.';
      }

    } catch (err: any) {
      console.error('Excepción al iniciar sesión:', err);
      this.errorMessage = 'Ocurrió un error inesperado al iniciar sesión. Inténtelo de nuevo.';
    }
  }

  // Método para obtener el rol del usuario y redirigir
  private async redirectToDashboard(userId: string | undefined): Promise<void> {
    if (!userId) {
      console.warn('redirectToDashboard: userId es undefined.');
      this.router.navigate(['/']); // Redirigir a una página predeterminada
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles') // Asegúrate que tu tabla de perfiles se llame 'profiles' en Supabase
        .select('role') // Asume que tienes una columna 'role' en esa tabla
        .eq('id', userId) // La columna 'id' debe coincidir con el user_id de Supabase Auth
        .single(); // Esperamos un solo resultado

      if (error) {
        console.error('Error al obtener el rol del usuario desde Supabase:', error.message);
        this.errorMessage = 'Error al obtener su rol. Inténtelo de nuevo.';
        this.router.navigate(['/']); // Redirigir a una página predeterminada
        return;
      }

      if (data && data.role) {
        // Guardar el rol en localStorage para que el Navbar lo pueda leer (sin AuthService)
        localStorage.setItem('user_role', data.role);

        if (data.role === 'admin') {
          this.router.navigate(['/admin/dashboard']); // Redirigir a dashboard de administrador
        } else if (data.role === 'resident') {
          this.router.navigate(['/resident/dashboard']); // Redirigir a dashboard de residente
        } else {
          console.warn('Rol de usuario desconocido:', data.role);
          this.errorMessage = 'Rol de usuario no reconocido. Contacte al administrador.';
          this.router.navigate(['/']);
        }
      } else {
        console.warn('No se encontró rol para el usuario:', userId);
        this.errorMessage = 'Su perfil no tiene un rol asignado. Contacte al administrador.';
        this.router.navigate(['/']);
      }
    } catch (e: any) {
      console.error('Excepción al redirigir al dashboard:', e.message);
      this.errorMessage = 'Error inesperado al redirigir.';
      this.router.navigate(['/']);
    }
  }
}