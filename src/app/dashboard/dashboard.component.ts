import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Importa Router y RouterModule
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../core/infrastructure/supabase/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // <-- CRÍTICO: Necesario para que el router-outlet funcione
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  isLoading: boolean = true;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router // <-- Inject Router
  ) { }

  async ngOnInit() {
    console.log('--- Iniciando ngOnInit en DashboardComponent (Layout) ---');
    this.isLoading = true; // Start loading
    try {
      const session = await this.supabaseService.getSession();

      if (!session?.user?.id) {
        console.warn('DashboardComponent: No hay usuario autenticado. Redirigiendo a login.');
        this.userRole = 'guest';
        // authGuard should ideally handle this, but as a fallback:
        this.router.navigate(['/auth/login'], { replaceUrl: true });
        this.isLoading = false;
        return;
      }

      const profileData = await this.supabaseService.getProfile(session.user.id);
      if (profileData && profileData.role) {
        this.userRole = profileData.role.toLowerCase();
        console.log('DashboardComponent: Rol de usuario para el layout:', this.userRole);

        // Perform role-based redirection
        if (this.router.url === '/dashboard' || this.router.url === '/dashboard/') { // Only redirect if at base /dashboard path
            if (this.userRole === 'admin') {
                this.router.navigate(['/dashboard/admin-home'], { replaceUrl: true });
            } else if (this.userRole === 'resident') {
                this.router.navigate(['/dashboard/resident-home'], { replaceUrl: true });
            } else {
                console.warn('DashboardComponent: Rol desconocido o no asignado:', this.userRole, '. Redirigiendo a no autorizado.');
                this.router.navigate(['/unauthorized'], { replaceUrl: true });
            }
        }
        // If already on a specific dashboard path (e.g., /dashboard/admin-home), let the existing route guards handle it.
        // The router-outlet will then load the appropriate component based on the current URL.

      } else {
        console.warn('DashboardComponent: Usuario autenticado pero sin perfil o rol en la BD:', session.user.id, '. Redirigiendo a no autorizado.');
        this.userRole = 'needs_profile_setup'; // Or 'unknown_role'
        this.router.navigate(['/unauthorized'], { queryParams: { error: 'profile_incomplete' }, replaceUrl: true });
      }
    } catch (e: any) {
      console.error('DashboardComponent: Error inesperado en ngOnInit:', e);
      this.userRole = 'error_catch';
      this.router.navigate(['/unauthorized'], { queryParams: { error: 'dashboard_init_error' }, replaceUrl: true });
    } finally {
      this.isLoading = false;
    }
  }
}