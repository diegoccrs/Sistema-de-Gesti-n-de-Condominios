// src/app/dashboard/components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router'; // Asegúrate de que RouterModule esté importado
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar'; // Importar MatToolbarModule

import { SupabaseService, ProfileWithApartmentInfo } from '@backend/infrastructure/supabase.service';
import { Announcement } from '@backend/models/announcement.model';
import { AnnouncementFormDialogComponent } from './announcement-form-dialog/announcement-form-dialog.component';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { Subject, takeUntil } from 'rxjs';


import { PaymentRegisterComponent } from '../payment-register/payment-register.component';

import { CreateResidentFormDialogComponent } from './manage-resident-form-dialog/create-resident-form-dialog/create-resident-form-dialog.component'; // Added import
import { EditResidentFormDialogComponent } from './manage-resident-form-dialog/edit-resident-form-dialog/edit-resident-form-dialog.component'; // Added import
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AssignDebtDialogComponent } from './assign-debt-dialog/assign-debt-dialog.component';
import { SelectResidentDialogComponent } from './select-resident-dialog/select-resident-dialog.component';
import { ReminderConfigComponent } from '../../reminder-config/reminder-config.component';

import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';

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
    MatToolbarModule, 
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    DropdownMenuComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  providers: [DatePipe]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentYear: number = new Date().getFullYear();
  adminName: string = 'Administrador';
  pendingPaymentsCount: number = 0;
  activeResidentsCount: number = 0;
  activeAnnouncementsCount: number = 0;
  pendingProofCount: number = 0;
  pendingFeedbackCount: number = 0;
  searchQuery: string = '';
  searchResults: ProfileWithApartmentInfo[] = [];
  isSearching: boolean = false;
  announcements: Announcement[] = [];
  displayedAnnouncementColumns: string[] = ['title', 'content_snippet', 'created_at', 'expiration_date', 'is_published', 'priority', 'actions'];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  recentResidents: ProfileWithApartmentInfo[] = [];
  recentResidentsColumns: string[] = ['name', 'email', 'apartment', 'actions'];
  isLoadingResidents = false;
  private destroy$ = new Subject<void>();

  adminMenuItems = [
  { label: 'Crear residentes', action: 'create_resident',  },
  { label: 'Documentos comunes', action: 'documents', },
  { label: 'Enviar recordatorio', action: 'send_reminder',  },
  {label: 'Asignar deudas', action: 'assign_debt',  },
  {label: "Reportes de pagos confirmados", action: 'generate_report',  },
  {label: "Gestionar reportes", action: 'goToGenerateReports',  },
];

  constructor(
    private supabaseService: SupabaseService,
    public dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) { }

  onMenuItemSelected(action: string): void {
    switch (action) {
      case 'create_resident':
        this.openCreateResidentDialog();
      break;
    case 'documents':
      this.goToManageDocuments();
      break;
    case 'send_reminder':
      this.openReminderConfigDialog();
      break;
    case 'assign_debt':
      this.openAssignDebtDialog();
      break;
    case 'generate_report':
      this.generarReporte();
      break;
    case 'goToGenerateReports':
      this.goToFeedbackManagement();
      break;
  }
}

  async ngOnInit(): Promise<void> {
    await this.loadAdminData();
    await this.loadAnnouncements();
    await this.loadRecentResidents()
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

  async searchResidents(): Promise<void> {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    try {
      this.searchResults = await this.supabaseService.searchProfiles(this.searchQuery);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      this.snackBar.open('Error al buscar residentes', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isSearching = false;
    }
  }

  async loadRecentResidents(): Promise<void> {
    this.isLoadingResidents = true;
    try {
      this.recentResidents = (await this.supabaseService.searchProfiles(''))
        .filter(p => p.role === 'resident')
        .slice(0, 5);
    } catch (error) {
      console.error('Error al cargar residentes recientes:', error);
    } finally {
      this.isLoadingResidents = false;
    }
  }

  openEditResidentDialog(resident: ProfileWithApartmentInfo): void {
    const dialogRef = this.dialog.open(EditResidentFormDialogComponent, {
      width: '500px',
      data: { resident } // Pasamos el objeto residente completo
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Actualizar la lista de residentes
        const index = this.recentResidents.findIndex(r => r.id === result.updatedResident.id);
        if (index !== -1) {
          this.recentResidents[index] = {
            ...this.recentResidents[index],
            ...result.updatedResident
          };
        }
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      } else if (result?.deleted) {
        this.recentResidents = this.recentResidents.filter(r => r.id !== result.residentId);
      }
    });
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
          this.pendingPaymentsCount = allPayments.filter(p => p.status === 'pending' && !(p as any).reported_at).length;



          this.pendingProofCount = allPayments.filter(p => p.status === 'pending' && (p as any).reported_at).length;

          const allProfiles = await this.supabaseService.searchProfiles('');
          this.activeResidentsCount = allProfiles.filter(p => p.role === 'resident').length;
          
          // Load feedback metrics
          const allFeedback = await this.supabaseService.getFeedback();
          this.pendingFeedbackCount = allFeedback.filter(f => f.status === 'pending').length;
        }
      }
    } catch (error: any) {
      console.error('Error al cargar datos del administrador:', error);
      this.errorMessage = `Error al cargar datos: ${error.message || error}`;
    } finally { }
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

  openCreateResidentDialog(): void {
    const dialogRef = this.dialog.open(CreateResidentFormDialogComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
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

  goToRegisterPayment(): void {
    this.dialog.open(PaymentRegisterComponent, {
      width: '1000px'
    });

  }

  goToCreateResident(): void {
    this.openCreateResidentDialog();
  }

  goToManageResidents(): void {
    this.router.navigate(['/dashboard/residents-management']);
  }

  goToReviewProofs(tipo: 'deudas' | 'comprobantes'): void {
    this.router.navigate(['/dashboard/payments-confirmation'], {
      queryParams: { tipo }
    });
  }


  goToGenerateReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  goToManageDocuments(): void {
    this.router.navigate(['/dashboard/documents']);
  }

  goToFeedbackManagement(): void {
    this.router.navigate(['/dashboard/feedback-management']);
  }

  goToManageAnnouncements(): void {

    const announcementsSection = document.querySelector('.admin-announcements-list-section');
    if (announcementsSection) {
      announcementsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('Announcements section not found for scrolling.');
    }
  }

  goToFinancialManagement(): void {
    this.router.navigate(['/admin/financial']);
  }

  goToUserManagement(): void {
    this.router.navigate(['/admin/users']);
  }

  async openAssignDebtDialog(): Promise<void> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      this.snackBar.open('Error: no se encontró usuario logueado.', 'Cerrar', { duration: 3000 });
      return;
    }

    const profile = await this.supabaseService.getProfile(user.id);
    if (!profile) {
      this.snackBar.open('No se encontró perfil de administrador.', 'Cerrar', { duration: 3000 });
      return;
    }

    const selectDialogRef = this.dialog.open(SelectResidentDialogComponent, {
      width: '500px'
    });

    selectDialogRef.afterClosed().subscribe(resident => {
      if (!resident) return;

      const dialogRef = this.dialog.open(AssignDebtDialogComponent, {
        width: '500px',
        data: { residentId: resident.id }
      });

      dialogRef.afterClosed().subscribe(async result => {
        if (result) {
          try {
            await this.supabaseService.insertPayment({
              resident_id: result.resident_id,
              concept: result.concept,
              amount: result.amount,
              status: 'pending',
              currency: result.currency,
              payment_date: result.payment_date,
              expiration_date: result.expiration_date,
              proof_url: null,
              reported_at: null
            });

            this.snackBar.open('Deuda asignada con éxito.', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          } catch (error: any) {
            console.error('Error al asignar deuda:', error);
            this.snackBar.open(`Error: ${error.message}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['snackbar-error']
            });
          }
        }
      });
    });
  }
  openReminderConfigDialog(): void {
    this.dialog.open(ReminderConfigComponent, {
      width: '500px',
      disableClose: true
    });
  }
  async generarReporte(): Promise<void> {
    try {
      // Importación correcta dentro del método
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      (pdfMakeModule as any).default.vfs = (pdfFontsModule as any).default;

      const { data, error } = await this.supabaseService.supabase
        .from('payments')
        .select('concept, amount, currency, payment_date, status');

      if (error) {
        throw new Error('Error al obtener pagos: ' + error.message);
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const approvedPayments = data?.filter(p => {
        const date = new Date(p.payment_date);
        return (
          p.status === 'approved' &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      }) ?? [];

      const docDefinition: any = {
        content: [
          { text: 'Reporte Mensual de Pagos Confirmados', style: 'header' },
          {
            text: `Mes: ${currentDate.toLocaleString('es-ES', {
              month: 'long',
              year: 'numeric'
            })}`,
            style: 'subheader'
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto'],
              body: [
                ['Concepto', 'Monto', 'Moneda', 'Fecha de Pago'],
                ...approvedPayments.map(p => [
                  p.concept,
                  `${p.amount.toFixed(2)}`,
                  p.currency,
                  new Date(p.payment_date).toLocaleDateString('es-ES')
                ])
              ]
            }
          }
        ],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          subheader: { fontSize: 14, margin: [0, 10, 0, 10] }
        }
      };

      // Usar el pdfMake importado dinámicamente
      (pdfMakeModule as any).default.createPdf(docDefinition).open();

    } catch (err: any) {
      console.error('Error al generar reporte:', err);
      this.snackBar.open('No se pudo generar el reporte.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-error']
      });
    }
  }

}  