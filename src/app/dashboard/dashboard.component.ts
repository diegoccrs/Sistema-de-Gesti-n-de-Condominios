import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ResidentDashboardComponent } from './components/resident-dashboard/resident-dashboard.component';
import { SupabaseService } from '../core/infrastructure/supabase/supabase.service'; // <--- Importa tu servicio Supabase

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AdminDashboardComponent,
    ResidentDashboardComponent,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = ''; // Inicializado a cadena vacía
  isLoading: boolean = true; // Para mostrar un spinner mientras se carga

  // Inyecta el SupabaseService en el constructor
  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    console.log('--- Iniciando ngOnInit en DashboardComponent ---');
    try {
      // Usar el método getSession() de tu SupabaseService
      const session = await this.supabaseService.getSession();

      if (!session?.user?.id) {
        console.warn('No hay usuario autenticado o ID de usuario no disponible. Redirigiendo o mostrando error.');
        this.userRole = 'guest'; // O redirigir al login si no hay sesión
        // Aquí podrías redirigir al login si este componente no debe ser accesible sin login
        // this.router.navigate(['/auth/login']); 
        console.log('userRole establecido a:', this.userRole);
        this.isLoading = false;
        return;
      }

      console.log('Sesión obtenida:', session);
      console.log('ID de usuario de la sesión:', session.user.id);

      // Usar el método getProfile() de tu SupabaseService
      const profileData = await this.supabaseService.getProfile(session.user.id);

      if (profileData) {
        console.log('Datos de perfil obtenidos:', profileData);
        this.userRole = profileData.role?.toLowerCase() || 'unknown_role';
        console.log('Rol del perfil antes de asignar a userRole:', profileData.role);
        console.log('Valor final de userRole:', this.userRole);
      } else {
        // Esto significa que el usuario está autenticado en auth.users, pero NO tiene un perfil en la tabla 'profiles'.
        // Aquí es donde el trigger de Supabase (o la lógica de creación de perfil) es CRÍTICA.
        console.warn('Usuario autenticado pero sin perfil en la base de datos:', session.user.id);
        this.userRole = 'needs_profile_setup'; // Un estado específico para esto
        console.log('userRole establecido a:', this.userRole);

        // Considera redirigir a una página para completar el perfil
        // this.router.navigate(['/complete-profile']);
      }
    } catch (e: any) {
      console.error('Error inesperado en DashboardComponent ngOnInit:', e);
      this.userRole = 'error_catch';
      console.log('userRole establecido a:', this.userRole);
    } finally {
      this.isLoading = false; // Oculta el spinner de carga
    }
  }
}