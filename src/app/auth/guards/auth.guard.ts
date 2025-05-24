import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  try {
    // Verificar sesión en Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('AuthGuard: No hay sesión activa. Redirigiendo al login.');
      router.navigate(['/auth/login']);
      return false;
    }

    console.log('AuthGuard: Sesión válida detectada. Acceso permitido al dashboard.');
    return true;

  } catch (error) {
    console.error('AuthGuard: Error de verificación:', error);
    router.navigate(['/auth/login']);
    return false;
  }
};