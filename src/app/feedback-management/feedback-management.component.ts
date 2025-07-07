import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SupabaseService } from '@backend/infrastructure/supabase.service';
import { Feedback } from '@backend/models/feedback.model';
import { FeedbackDetailDialogComponent } from './feedback-detail-dialog/feedback-detail-dialog.component';

@Component({
  selector: 'app-feedback-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatToolbarModule,
    FormsModule
  ],
  templateUrl: './feedback-management.component.html',
  styleUrls: ['./feedback-management.component.css']
})
export class FeedbackManagementComponent implements OnInit {
  feedbackList: Feedback[] = [];
  filteredFeedbackList: Feedback[] = [];
  displayedColumns: string[] = [
    'id', 'title', 'category', 'urgency', 'status', 'location', 'created_at', 'actions'
  ];
  
  isLoading = false;
  
  // Filters
  statusFilter = 'all';
  urgencyFilter = 'all';
  categoryFilter = 'all';
  
  statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'resolved', label: 'Resuelto' },
    { value: 'closed', label: 'Cerrado' }
  ];
  
  urgencyOptions = [
    { value: 'all', label: 'Todas las urgencias' },
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];
  
  categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'Problema Técnico', label: 'Problema Técnico' },
    { value: 'Problema de Mantenimiento', label: 'Problema de Mantenimiento' },
    { value: 'Problema de Seguridad', label: 'Problema de Seguridad' },
    { value: 'Problema de Limpieza', label: 'Problema de Limpieza' },
    { value: 'Ruido', label: 'Ruido' },
    { value: 'Vecinos', label: 'Vecinos' },
    { value: 'Administración', label: 'Administración' },
    { value: 'Sugerencia', label: 'Sugerencia' },
    { value: 'Otro', label: 'Otro' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFeedback();
  }

  async loadFeedback(): Promise<void> {
    this.isLoading = true;
    try {
      this.feedbackList = await this.supabaseService.getFeedback();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading feedback:', error);
      this.snackBar.open('Error al cargar los reportes', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters(): void {
    this.filteredFeedbackList = this.feedbackList.filter(feedback => {
      const statusMatch = this.statusFilter === 'all' || feedback.status === this.statusFilter;
      const urgencyMatch = this.urgencyFilter === 'all' || feedback.urgency === this.urgencyFilter;
      const categoryMatch = this.categoryFilter === 'all' || feedback.category === this.categoryFilter;
      
      return statusMatch && urgencyMatch && categoryMatch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openFeedbackDetail(feedback: Feedback): void {
    const dialogRef = this.dialog.open(FeedbackDetailDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { feedback }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        this.loadFeedback(); // Reload to get updated data
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warn';
      case 'in_progress': return 'accent';
      case 'resolved': return 'primary';
      case 'closed': return '';
      default: return '';
    }
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'low': return 'primary';
      case 'medium': return 'accent';
      case 'high': return 'warn';
      case 'urgent': return 'warn';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  }

  getUrgencyLabel(urgency: string): string {
    switch (urgency) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return urgency;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin-home']);
  }

  getTruncatedId(id: string): string {
    return id.substring(0, 8) + '...';
  }

  getPendingCount(): number {
    return this.feedbackList.filter(f => f.status === 'pending').length;
  }

  getInProgressCount(): number {
    return this.feedbackList.filter(f => f.status === 'in_progress').length;
  }

  getResolvedCount(): number {
    return this.feedbackList.filter(f => f.status === 'resolved').length;
  }

  getUrgentCount(): number {
    return this.feedbackList.filter(f => f.urgency === 'urgent').length;
  }
}
