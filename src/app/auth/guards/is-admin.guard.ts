import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // Asegúrate de que esta ruta sea correcta

export const isAdminGuard: CanActivateFn = async (route, state) => {
  const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
  const router = inject(Router);

  try {
    // 1. Verificar si hay un usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn('isAdminGuard: No user found or error getting user:', userError?.message);
      // Si no hay usuario, redirigir a la página de login
      router.navigate(['/auth/login']);
      return false;
    }

    // 2. Obtener el perfil del usuario para verificar su rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role') // Solo necesitamos la columna 'role'
      .eq('id', user.id) // Buscar el perfil por el ID del usuario autenticado
      .single(); // Esperamos un solo resultado

    if (profileError || !profile) {
      console.error('isAdminGuard: Error fetching user profile or profile not found:', profileError?.message);
      router.navigate(['/unauthorized']); // O a una página de error/no encontrado
      return false;
    }

    // 3. Verificar si el rol es 'admin'
    if (profile.role === 'admin') {
      return true; // El usuario es un administrador, permitir el acceso
    } else {
      console.warn(`isAdminGuard: User ${user.id} is not an admin. Role: ${profile.role}`);
      router.navigate(['/unauthorized']); // Redirigir a una página de "Acceso no autorizado"
      return false;
    }
  } catch (e: any) {
    console.error('isAdminGuard: Unexpected error during guard execution:', e.message);
    router.navigate(['/unauthorized']); // Capturar cualquier otro error inesperado
    return false;
  }
};