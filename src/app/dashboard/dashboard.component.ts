import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importa RouterModule para que <router-outlet> funcione
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Para el spinner de carga
import { SupabaseService } from '../core/infrastructure/supabase/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // <-- CRÍTICO: Necesario para que el router-outlet funcione
    MatProgressSpinnerModule // Para el spinner
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  isLoading: boolean = true;

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    console.log('--- Iniciando ngOnInit en DashboardComponent (Layout) ---');
    try {
      const session = await this.supabaseService.getSession();

      if (!session?.user?.id) {
        console.warn('No hay usuario autenticado o ID de usuario no disponible. Redirigiendo o mostrando error.');
        this.userRole = 'guest';
        this.isLoading = false;
        return;
      }

      const profileData = await this.supabaseService.getProfile(session.user.id);
      if (profileData) {
        this.userRole = profileData.role?.toLowerCase() || 'unknown_role';
        console.log('Rol de usuario para el layout:', this.userRole);
      } else {
        console.warn('Usuario autenticado pero sin perfil en la base de datos:', session.user.id);
        this.userRole = 'needs_profile_setup';
      }
    } catch (e: any) {
      console.error('Error inesperado en DashboardComponent ngOnInit:', e);
      this.userRole = 'error_catch';
    } finally {
      this.isLoading = false;
    }
  }
}