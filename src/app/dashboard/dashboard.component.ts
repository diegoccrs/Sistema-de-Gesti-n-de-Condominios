import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ResidentDashboardComponent } from './components/resident-dashboard/resident-dashboard.component';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

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
  userRole: string = '';

  async ngOnInit() {
    try {
        console.log('--- Iniciando ngOnInit en DashboardComponent ---');

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Error al obtener sesión:', sessionError);
            this.userRole = 'error'; // Un valor para mostrar el error
            console.log('userRole establecido a:', this.userRole);
            return;
        }

        console.log('Sesión obtenida:', session);
        console.log('ID de usuario de la sesión:', session?.user?.id);

        if (!session?.user?.id) {
            console.warn('No hay usuario autenticado o ID de usuario no disponible. Redirigiendo o mostrando error.');
            this.userRole = 'guest'; // O redirigir al login
            console.log('userRole establecido a:', this.userRole);
            return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, first_name, last_name') // Asegúrate de seguir pidiendo el nombre y apellido si los necesitas
          .eq('id', session.user.id)
          .single();

        if (profileError) {
            console.error('Error al obtener perfil del usuario desde Supabase:', profileError);
            this.userRole = 'error_profile'; // Otro valor para el error específico del perfil
            console.log('userRole establecido a:', this.userRole);
        } else {
                console.log('Datos de perfil obtenidos:', profileData);
                // Asegúrate de que el valor por defecto sea 'resident' (o el rol que quieras si no se encuentra)
                this.userRole = profileData?.role?.toLowerCase() || 'unknown_role'; // 'unknown_role' si no hay un rol válido
                console.log('Rol del perfil antes de asignar a userRole:', profileData?.role);
                console.log('Valor final de userRole:', this.userRole);
        }
    } catch (e: any) {
        console.error('Error inesperado en DashboardComponent ngOnInit:', e);
        this.userRole = 'error_catch'; // Error genérico en el catch
        console.log('userRole establecido a:', this.userRole);
    }
  }
}