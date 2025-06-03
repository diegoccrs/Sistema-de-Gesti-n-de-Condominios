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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'; // <-- NUEVO: Importar MatSnackBar

import { SupabaseService } from '../../../core/infrastructure/supabase/supabase.service';
import { Announcement } from '../../../core/domain/models/announcement.model';
import { AnnouncementFormDialogComponent } from './announcement-form-dialog/announcement-form-dialog.component';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { Subject, takeUntil } from 'rxjs';

import { CreateResidentFormDialogComponent } from './create-resident-form-dialog/create-resident-form-dialog.component'; // <-- NUEVO: Importar el componente de diálogo de residente

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
    MatProgressSpinnerModule,
    // ¡NUEVO! Asegúrate de que el diálogo de residente esté en los imports si es standalone
    CreateResidentFormDialogComponent // Aunque no se usa directamente en el HTML, es una dependencia del diálogo
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  providers: [DatePipe]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  adminName: string = 'Administrador';
  pendingPaymentsCount: number = 0;
  activeResidentsCount: number = 0;
  activeAnnouncementsCount: number = 0;
  pendingProofCount: number = 0;

  announcements: Announcement[] = [];
  displayedAnnouncementColumns: string[] = ['title', 'content_snippet', 'created_at', 'expiration_date', 'is_published', 'priority', 'actions'];

  isLoading: boolean = true;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private supabaseService: SupabaseService,
    public dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar // <-- NUEVO: Inyectar MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAdminData();
    await this.loadAnnouncements();
    this.listenForAnnouncementsChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    const channel = this.supabaseService.supabase.channel('announcements_changes');
    if (channel) {
      this.supabaseService.supabase.removeChannel(channel);
    }
  }

  async loadAdminData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const profile = await this.supabaseService.getProfile(user.id);
        if (profile) {
          this.adminName = profile.first_name || 'Administrador';

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
    }
  }

  async loadAnnouncements(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      this.announcements = await this.supabaseService.getAnnouncements();
      this.activeAnnouncementsCount = this.announcements.filter(a => a.is_published).length;
    } catch (error: any) {
      console.error('Error al cargar anuncios:', error);
      this.errorMessage = `Error al cargar anuncios: ${error.message || error}`;
    } finally {
      this.isLoading = false;
    }
  }

  listenForAnnouncementsChanges(): void {
    this.supabaseService.supabase
      .channel('announcements_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('Cambio en anuncios detectado:', payload);
          this.loadAnnouncements();
        }
      )
      .subscribe();
  }

  openAnnouncementFormDialog(announcement?: Announcement): void {
    const dialogRef = this.dialog.open(AnnouncementFormDialogComponent, {
      width: '500px',
      data: { announcement: announcement }
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Announcement> | undefined) => {
      if (result) {
        this.isLoading = true;
        this.errorMessage = null;
        try {
          const user = await this.supabaseService.getCurrentUser();
          if (!user) {
            throw new Error('No se pudo obtener el usuario actual. Por favor, asegúrese de estar logueado.');
          }

          if (announcement) {
            await this.supabaseService.updateAnnouncement(announcement.id, result);
            this.snackBar.open('Anuncio actualizado con éxito.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
            console.log('Anuncio actualizado con éxito:', result);
          } else {
            const newAnnouncement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & { author_id: string } = {
              title: result.title!,
              content: result.content ?? null,
              expiration_date: result.expiration_date ?? null,
              is_published: result.is_published!,
              priority: result.priority!,
              attachment_url: result.attachment_url ?? null,
              author_id: user.id
            };
            await this.supabaseService.createAnnouncement(newAnnouncement);
            this.snackBar.open('Anuncio creado con éxito.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
            console.log('Anuncio creado con éxito:', newAnnouncement);
          }
          await this.loadAnnouncements();
        } catch (error: any) {
          console.error('Error al guardar el anuncio:', error);
          this.errorMessage = `Error al guardar el anuncio: ${error.message || error}`;
          this.snackBar.open(`Error: ${error.message || 'No se pudo guardar el anuncio.'}`, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  // <-- NUEVO: Método para abrir el diálogo de creación de residente -->
  openCreateResidentDialog(): void {
    const dialogRef = this.dialog.open(CreateResidentFormDialogComponent, {
      width: '500px', // Ancho deseado para el diálogo
      disableClose: true, // Opcional: no permite cerrar el diálogo haciendo clic fuera o con Esc
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
        // Opcional: Podrías querer recargar el contador de residentes o la lista de residentes aquí
        // this.loadAdminData();
      } else if (result && result.message) {
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 7000,
          panelClass: ['snackbar-error']
        });
      } else if (result === undefined) {
        this.snackBar.open('Creación de residente cancelada.', 'Cerrar', { duration: 3000 });
      }
    });
  }
  // <-- FIN NUEVO MÉTODO -->


  async deleteAnnouncement(announcementId: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) {
      this.isLoading = true;
      this.errorMessage = null;
      try {
        await this.supabaseService.deleteAnnouncement(announcementId);
        this.snackBar.open('Anuncio eliminado con éxito.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        console.log('Anuncio eliminado con éxito:', announcementId);
        await this.loadAnnouncements();
      } catch (error: any) {
        console.error('Error al eliminar el anuncio:', error);
        this.errorMessage = `Error al eliminar el anuncio: ${error.message || error}`;
        this.snackBar.open(`Error: ${error.message || 'No se pudo eliminar el anuncio.'}`, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
      } finally {
        this.isLoading = false;
      }
    }
  }

  getContentSnippet(content: string | null): string {
    if (!content) return '';
    return content.length > 50 ? content.substring(0, 47) + '...' : content;
  }

  // Métodos de navegación y nuevas acciones rápidas
  goToRegisterPayment(): void {
    this.router.navigate(['/admin/payments/create']);
  }

  // <-- NUEVO: Método para ir a crear residente (ahora abre el diálogo) -->
  goToCreateResident(): void {
    this.openCreateResidentDialog(); // Llama al método que abre el diálogo
  }
  // <-- FIN NUEVO MÉTODO -->


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