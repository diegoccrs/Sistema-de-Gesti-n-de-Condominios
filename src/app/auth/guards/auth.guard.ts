// src/app/auth/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // Asegúrate de la ruta correcta

// Inicialización de Supabase (igual que en el login, para que el guard tenga acceso)
const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  try {
    // Comprobar si hay una sesión activa de Supabase
    // Supabase mantiene la sesión en localStorage y la refresca si es válida.
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('AuthGuard: Sesión activa detectada. Permitiendo acceso.');
      return true; // El usuario está autenticado, permite el acceso a la ruta.
    } else {
      console.warn('AuthGuard: No hay sesión activa. Redirigiendo al login.');
      // No hay sesión, redirige al usuario a la página de login
      router.navigate(['/auth/login']);
      return false; // No permite el acceso a la ruta.
    }
  } catch (error) {
    console.error('AuthGuard: Error al verificar la sesión de Supabase:', error);
    // En caso de error, redirige al login por seguridad
    router.navigate(['/auth/login']);
    return false;
  }
};