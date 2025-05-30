import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  
  try {
    // Obtener sesión actualizada
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.warn('[AuthGuard] Sesión inválida. Redirigiendo a login...');
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: router.url }
      });
      return false;
    }

    console.log('[AuthGuard] Sesión válida detectada');
    return true;

  } catch (error) {
    console.error('[AuthGuard] Error crítico:', error);
    router.navigate(['/auth/login']);
    return false;
  }
};