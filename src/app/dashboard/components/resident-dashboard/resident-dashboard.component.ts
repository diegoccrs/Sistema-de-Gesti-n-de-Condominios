import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Importar spinner
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { DatePipe, CurrencyPipe } from '@angular/common'; // Importar Pipes
import { Router } from '@angular/router'; // Importar Router para redirecciones en las acciones

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

@Component({
  selector: 'app-resident-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UserProfileButtonComponent,
    DatePipe, // Añadido para los pipes de fecha
    CurrencyPipe // Añadido para el pipe de moneda
  ],
  templateUrl: './resident-dashboard.component.html',
  styleUrls: ['./resident-dashboard.component.css']
})
export class ResidentDashboardComponent implements OnInit {
  announcements: any[] = [];
  pendingPayments: any[] = [];
  isLoading = true; // Controla la carga inicial de toda la data (overlay global)
  isLoadingAnnouncements = true; // Controla la carga solo de la tarjeta de anuncios
  isLoadingPayments = true; // Controla la carga solo de la tarjeta de pagos
  errorMessage: string | null = null;
  residentName: string = 'Residente'; // Valor por defecto

  constructor(private router: Router) { } // Inyectar Router

  async ngOnInit() {
    this.isLoading = true; // Activa el spinner global
    this.errorMessage = null;

    try {
      // Carga paralela de datos, incluyendo el perfil del usuario
      await Promise.all([
        this.loadUserProfile(),
        this.loadAnnouncements(),
        this.loadPendingPayments()
      ]);
    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
      this.errorMessage = 'Hubo un problema al cargar los datos. Por favor, intenta recargar la página.';
    } finally {
      this.isLoading = false; // Desactiva el spinner global
    }
  }

  private async loadUserProfile() {
    const { data: userSession, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !userSession?.session) {
      console.error('Error obteniendo sesión del usuario:', sessionError);
      // this.errorMessage = 'No se pudo obtener la sesión del usuario.'; // Podrías mostrar un error aquí
      return;
    }

    const userId = userSession.session.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name') // *** CORRECCIÓN: 'first_name' según tu base de datos ***
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error al cargar el perfil del usuario:', profileError);
      this.residentName = 'Usuario'; // Asignar un nombre genérico en caso de error
    } else if (profile && profile.first_name) { // *** CORRECCIÓN: Acceder a profile.first_name ***
      this.residentName = profile.first_name;
    } else {
      this.residentName = 'Residente'; // En caso de que no haya nombre o esté vacío
    }
  }

  private async loadAnnouncements() {
    this.isLoadingAnnouncements = true; // Activa el spinner de la tarjeta de anuncios
    try {
      // Aquí puedes añadir RLS en Supabase para que solo vea anuncios de su condominio
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error al cargar anuncios:', error);
        throw new Error('No se pudieron cargar los anuncios.');
      }
      this.announcements = data || [];
    } catch (error) {
      // Manejo específico del error de anuncios si es necesario
      console.error("Error en loadAnnouncements:", error);
    } finally {
      this.isLoadingAnnouncements = false; // Desactiva el spinner de la tarjeta de anuncios
    }
  }

  private async loadPendingPayments() {
    this.isLoadingPayments = true; // Activa el spinner de la tarjeta de pagos
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
          console.error('Usuario no autenticado o error al obtener usuario:', userError);
          throw new Error('Usuario no autenticado.');
      }
      const userId = userData.user.id;

      const { data, error } = await supabase
        .from('payments')
        .select('*, currency_type(code)') // Asegúrate de que 'currency_type' sea una relación y tengas la columna 'code'
        .eq('resident_id', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error al cargar pagos pendientes:', error);
        throw new Error('No se pudieron cargar los pagos pendientes.');
      }
      this.pendingPayments = data.map(p => ({
          ...p,
          currency: p.currency_type ? p.currency_type.code : 'VES'
      })) || [];
    } catch (error) {
      // Manejo específico del error de pagos si es necesario
      console.error("Error en loadPendingPayments:", error);
    } finally {
      this.isLoadingPayments = false; // Desactiva el spinner de la tarjeta de pagos
    }
  }

  // Métodos de navegación/acción (ejemplos de cómo usar el router)
  openAnnouncementDetails(announcement: any) {
    console.log('Ver detalles del anuncio:', announcement);
    // this.router.navigate(['/announcement', announcement.id]);
    this.errorMessage = 'Visualización de detalles de anuncio en desarrollo.';
  }

  openPaymentDetails(payment: any) {
    console.log('Ver detalles de pago:', payment);
    // this.router.navigate(['/payment', payment.id]);
    this.errorMessage = 'Visualización de detalles de pago en desarrollo.';
  }

  uploadPaymentProof() {
    console.log('Navegar a subir comprobante');
    this.router.navigate(['/resident/payments/upload']);
  }

  reportIssue() {
    console.log('Navegar a reportar problema');
    this.router.navigate(['/resident/issues/report']);
    this.errorMessage = 'Funcionalidad "Reportar Problema" en desarrollo. ¡Próximamente!';
  }

  goToDocuments() {
    console.log('Navegar a documentos comunes');
    this.router.navigate(['/resident/documents']);
    this.errorMessage = 'Funcionalidad "Documentos Comunes" en desarrollo.';
  }

  contactAdmin() {
    console.log('Contactar administración');
    this.router.navigate(['/resident/contact-admin']);
    this.errorMessage = 'Funcionalidad "Contactar Administración" en desarrollo.';
  }
}