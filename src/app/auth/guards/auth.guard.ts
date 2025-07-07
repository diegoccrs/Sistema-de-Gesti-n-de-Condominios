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
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn('[AuthGuard] No active user found or error fetching user. Redirigiendo a login...', userError);
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: router.url }
      });
      return false;
    }

    console.log('[AuthGuard] Active user found:', user.id);
    return true;

  } catch (error) {
    console.error('[AuthGuard] Error crítico:', error);
    router.navigate(['/auth/login']);
    return false;
  }
};