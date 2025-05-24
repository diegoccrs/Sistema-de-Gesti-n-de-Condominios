import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Módulos de Angular Material
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';

// Supabase
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // Asegúrate de que esta ruta sea correcta

// Inicialización de Supabase
const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

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
    RouterLink // Para la directiva routerLink en el HTML
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // O './login.component.scss' si usas SASS
})
export class LoginComponent {
  fb = inject(FormBuilder);
  router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage: string | null = null; // Variable para mostrar mensajes de error al usuario

  constructor() {
    // Esto es para manejar redirecciones si el usuario ya está autenticado al cargar el componente
    // Es útil para la persistencia de la sesión.
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        console.log('Usuario ya autenticado. Redirigiendo desde onAuthStateChange...');
        // Aquí podrías querer redirigir solo si no estás ya en el dashboard
        if (!this.router.url.includes('/dashboard')) {
             await this.redirectToDashboard(session.user?.id);
        }
      }
    });
  }

  async login() {


    // Lógica de validación del formulario antes de intentar el login real
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      return;
    }

    this.errorMessage = null; // Limpiar mensaje de error previo

    const { email, password } = this.loginForm.value;

    try {
      // Intenta iniciar sesión con Supabase (lógica real)
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

  // src/app/auth/login/login.component.ts

// ... (código anterior) ...

  /**
   * Obtiene el rol del usuario desde Supabase y redirige al dashboard apropiado.
   * @param userId El ID del usuario autenticado.
   */
  // src/app/auth/login/login.component.ts

// ... (código anterior) ...

  /**
   * Obtiene el rol del usuario desde Supabase y redirige al dashboard apropiado.
   * @param userId El ID del usuario autenticado.
   */
  private async redirectToDashboard(userId: string | undefined): Promise<void> {
    if (!userId) {
      console.warn('redirectToDashboard: userId es undefined. Redirigiendo a la raíz.');
      this.router.navigate(['/']);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener el rol del usuario desde Supabase:', error.message);
        this.errorMessage = 'Error al obtener su rol. Inténtelo de nuevo o contacte al administrador.';
        this.router.navigate(['/']);
        return;
      }

      if (data && data.role) {
        const userRole = data.role.toLowerCase().trim(); 

        // Guardar el rol en localStorage para que el Navbar o Guards lo puedan leer
        localStorage.setItem('user_role', userRole);

        // Redirección condicional basada en el rol
        // Permitimos acceso al dashboard si el rol es 'admin' O 'residente'
        if (userRole === 'admin' || userRole === 'residente') { // <<-- ¡Esta es la línea clave de la corrección!
          this.router.navigate(['/dashboard']);
        } else {
          // Si el rol no es ni 'admin' ni 'residente', se considera desconocido
          console.warn('Rol de usuario desconocido:', userRole);
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
      this.errorMessage = 'Error inesperado al redirigir. Inténtelo de nuevo.';
      this.router.navigate(['/']);
    }
  }
}