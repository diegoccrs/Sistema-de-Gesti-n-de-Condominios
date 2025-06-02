// src/app/dashboard/components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importar DatePipe aquí
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Asegurarse de importar si se usa en el HTML del componente

import { SupabaseService } from '../../../core/infrastructure/supabase/supabase.service';
import { Announcement } from '../../../core/domain/models/announcement.model';
import { AnnouncementFormDialogComponent } from './announcement-form-dialog/announcement-form-dialog.component';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { Subject, takeUntil } from 'rxjs'; // Para la desuscripción de observables

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
    RouterModule,
    UserProfileButtonComponent,
    MatProgressBarModule,
    MatProgressSpinnerModule // Añadir MatProgressSpinnerModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  providers: [DatePipe] // Proveer DatePipe para usar en el template
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  adminName: string = 'Administrador';
  pendingPaymentsCount: number = 0;
  activeResidentsCount: number = 0;
  activeAnnouncementsCount: number = 0;
  pendingProofCount: number = 0;

  announcements: Announcement[] = [];
  displayedAnnouncementColumns: string[] = ['title', 'content_snippet', 'created_at', 'expiration_date', 'is_published', 'priority', 'actions'];

  isLoading: boolean = true; // Controla la carga inicial y la de los anuncios
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>(); // Para desuscribir observables al destruir el componente

  constructor(
    private supabaseService: SupabaseService,
    public dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe // Inyectar DatePipe
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAdminData();
    await this.loadAnnouncements();
    this.listenForAnnouncementsChanges(); // Suscribirse a cambios en tiempo real
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Desuscribirse del canal de Supabase en tiempo real
    const channel = this.supabaseService.supabase.channel('announcements_changes');
    if (channel) {
      this.supabaseService.supabase.removeChannel(channel);
    }
  }

  async loadAdminData(): Promise<void> {
    this.isLoading = true; // Activar loading global al inicio
    this.errorMessage = null;
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const profile = await this.supabaseService.getProfile(user.id);
        if (profile) {
          this.adminName = profile.first_name || 'Administrador';

          // Aquí deberías obtener los datos reales de tus contadores
          const allPayments = await this.supabaseService.getAllPayments();
          this.pendingPaymentsCount = allPayments.filter(p => p.status === 'pending').length;

          // Placeholder para otros contadores
          this.activeResidentsCount = 0; // Implementar lógica para obtener esto
          this.pendingProofCount = 0; // Implementar lógica para obtener esto
        }
      }
    } catch (error: any) {
      console.error('Error al cargar datos del administrador:', error);
      this.errorMessage = `Error al cargar datos: ${error.message || error}`;
    } finally {
      // El isLoading global se desactivará después de que loadAnnouncements también termine
      // Si solo quieres que este método controle su propio loading, usa una variable separada.
      // Por ahora, se mantendrá un loading global.
    }
  }

  async loadAnnouncements(): Promise<void> {
    this.isLoading = true; // Activar indicador de carga para los anuncios específicamente si loadAdminData ya terminó
    this.errorMessage = null;
    try {
      this.announcements = await this.supabaseService.getAnnouncements();
      this.activeAnnouncementsCount = this.announcements.filter(a => a.is_published).length;
    } catch (error: any) {
      console.error('Error al cargar anuncios:', error);
      this.errorMessage = `Error al cargar anuncios: ${error.message || error}`;
    } finally {
      this.isLoading = false; // Desactivar indicador de carga una vez que los anuncios se hayan cargado o haya habido un error.
    }
  }

  listenForAnnouncementsChanges(): void {
    this.supabaseService.supabase
      .channel('announcements_changes') // Nombre de canal único
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('Cambio en anuncios detectado:', payload);
          // Recargar los anuncios para reflejar el cambio en la tabla
          this.loadAnnouncements();
        }
      )
      .subscribe();
  }

  openAnnouncementFormDialog(announcement?: Announcement): void {
    const dialogRef = this.dialog.open(AnnouncementFormDialogComponent, {
      width: '500px', // Ancho del diálogo
      data: { announcement: announcement } // Pasa el objeto anuncio si es para edición
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Announcement> | undefined) => {
      if (result) { // Si el diálogo se cerró con datos (es decir, el usuario "guardó")
        this.isLoading = true; // Activar barra de progreso en el dashboard
        this.errorMessage = null;
        try {
          const user = await this.supabaseService.getCurrentUser();
          if (!user) {
            throw new Error('No se pudo obtener el usuario actual. Por favor, asegúrese de estar logueado.');
          }

          if (announcement) { // Modo edición: 'announcement' original existe
            // Llamamos a updateAnnouncement con el ID del anuncio original y los datos del formulario
            await this.supabaseService.updateAnnouncement(announcement.id, result);
            console.log('Anuncio actualizado con éxito:', result);
          } else { // Modo creación: 'announcement' original es undefined
            // Creamos un nuevo objeto, añadiendo el author_id
            const newAnnouncement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & { author_id: string } = {
              title: result.title!, // Usamos ! para asegurar que no es null/undefined
              content: result.content ?? null,
              expiration_date: result.expiration_date ?? null,
              is_published: result.is_published!,
              priority: result.priority!,
              attachment_url: result.attachment_url ?? null, // Añadir attachment_url, puede ser null si no se usa
              author_id: user.id // El ID del usuario actual es el autor
            };
            await this.supabaseService.createAnnouncement(newAnnouncement);
            console.log('Anuncio creado con éxito:', newAnnouncement);
          }
          await this.loadAnnouncements(); // Recargar la lista de anuncios para mostrar el cambio
        } catch (error: any) {
          console.error('Error al guardar el anuncio:', error);
          this.errorMessage = `Error al guardar el anuncio: ${error.message || error}`;
        } finally {
          this.isLoading = false; // Desactivar barra de progreso
        }
      }
    });
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) {
      this.isLoading = true;
      this.errorMessage = null;
      try {
        await this.supabaseService.deleteAnnouncement(announcementId);
        console.log('Anuncio eliminado con éxito:', announcementId);
        await this.loadAnnouncements(); // Recargar la lista después de la eliminación
      } catch (error: any) {
        console.error('Error al eliminar el anuncio:', error);
        this.errorMessage = `Error al eliminar el anuncio: ${error.message || error}`;
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Helper para formatear el snippet del contenido en la tabla
  getContentSnippet(content: string | null): string {
    if (!content) return '';
    return content.length > 50 ? content.substring(0, 47) + '...' : content;
  }

  // Métodos de navegación para las acciones rápidas y funcionalidades completas
  goToRegisterPayment(): void {
    this.router.navigate(['/admin/payments/create']);
  }

  goToManageResidents(): void {
    this.router.navigate(['/admin/residents']);
  }

  goToReviewProofs(): void {
    this.router.navigate(['/admin/proofs']);
  }

  goToGenerateReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  goToManageDocuments(): void {
    this.router.navigate(['/admin/documents']);
  }

  goToManageAnnouncements(): void {
    // Si la gestión de anuncios es en esta misma página, simplemente recargamos
    // y hacemos scroll si es necesario. Si fuera una página separada, navegaríamos.
    this.loadAnnouncements();
    document.querySelector('.admin-announcements-list-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToFinancialManagement(): void {
    this.router.navigate(['/admin/financial']);
  }

  goToUserManagement(): void {
    this.router.navigate(['/admin/users']);
  }
}