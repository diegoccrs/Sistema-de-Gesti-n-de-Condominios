import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

// Importar MatDialog y AnuncioComponent
import { MatDialog } from '@angular/material/dialog';
import { AnuncioComponent } from '../../../auth/anuncio/anuncio.component'; // Asegúrate de la ruta correcta

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UserProfileButtonComponent,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule
    // MatDialogModule no se importa aquí, solo el servicio MatDialog
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  adminName: string = 'Administrador';
  isLoading = true;
  errorMessage: string | null = null;

  pendingPaymentsCount: number = 0;
  activeResidentsCount: number = 0;
  activeAnnouncementsCount: number = 0;
  pendingProofCount: number = 0;

  // Inyectar MatDialog en el constructor
  constructor(private router: Router, public dialog: MatDialog) { }

  async ngOnInit() {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      await Promise.all([
        this.loadAdminProfile(),
        this.loadDashboardStats()
      ]);
    } catch (error) {
      console.error('Error al cargar el dashboard del administrador:', error);
      this.errorMessage = 'Hubo un problema al cargar los datos. Por favor, intenta recargar la página.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAdminProfile() {
    const { data: userSession, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !userSession?.session) {
      console.error('Error obteniendo sesión del administrador:', sessionError);
      return;
    }

    const userId = userSession.session.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error al cargar el perfil del administrador:', profileError);
      this.adminName = 'Administrador';
    } else if (profile && profile.first_name) {
      this.adminName = profile.first_name;
    } else {
      this.adminName = 'Administrador';
    }
  }

  private async loadDashboardStats() {
    const { count: paymentsCount, error: paymentsError } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_admin_review');

    if (paymentsError) {
      console.error('Error cargando pagos pendientes:', paymentsError);
    } else {
      this.pendingPaymentsCount = paymentsCount || 0;
    }

    const { count: residentsCount, error: residentsError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'resident')
      

    if (residentsError) {
      console.error('Error cargando residentes activos:', residentsError);
    } else {
      this.activeResidentsCount = residentsCount || 0;
    }

    const { count: announcementsCount, error: announcementsError } = await supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      

    if (announcementsError) {
      console.error('Error cargando anuncios activos:', announcementsError);
    } else {
      this.activeAnnouncementsCount = announcementsCount || 0;
    }

    const { count: proofsCount, error: proofsError } = await supabase
      .from('payment_proofs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    if (proofsError) {
        console.error('Error cargando comprobantes pendientes:', proofsError);
    } else {
        this.pendingProofCount = proofsCount || 0;
    }
  }

  // --- NUEVO MÉTODO PARA ABRIR EL DIÁLOGO DE ANUNCIO ---
  goToCreateAnnouncement(): void {
    const dialogRef = this.dialog.open(AnuncioComponent, {
      width: '600px', // Ancho deseado del diálogo
      disableClose: true, // Opcional: Para evitar cerrar el diálogo haciendo clic fuera o con Escape
      data: { /* puedes pasar datos si el diálogo los necesita */ }
    });

    // Suscribirse al evento afterClosed para saber cuando el diálogo se cierra
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Lógica a ejecutar si el anuncio se publicó con éxito
        console.log(result.message);
        // Opcional: mostrar un Snackbar de éxito o recargar estadísticas de anuncios
        this.loadDashboardStats(); // Recargar las estadísticas para que el nuevo anuncio se refleje
      } else if (result === undefined) {
        // El diálogo se cerró sin enviar (por ejemplo, con el botón Cancelar o Escape)
        console.log('Creación de anuncio cancelada.');
      }
    });
  }

  // Los demás métodos de navegación se mantienen, pero ya no se usan para el anuncio
  goToRegisterPayment() {
    this.router.navigate(['/admin/payments/register']);
  }

  goToManageResidents() {
    this.router.navigate(['/admin/users/manage']);
  }

  goToReviewProofs() {
    this.router.navigate(['/admin/payments/proofs']);
  }

  goToGenerateReports() {
    this.router.navigate(['/admin/reports']);
  }

  goToManageDocuments() {
    this.router.navigate(['/admin/documents/manage']);
  }

  goToManageAnnouncements() {
    // Si quieres una página para gestionar anuncios existentes, iría aquí
    this.router.navigate(['/admin/announcements/manage']);
  }

  goToFinancialManagement() {
    this.router.navigate(['/admin/financial']);
  }

  goToUserManagement() {
    this.router.navigate(['/admin/users']);
  }
}