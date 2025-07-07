import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { SupabaseService } from '@backend/infrastructure/supabase.service';
import { Feedback } from '@backend/models/feedback.model';

@Component({
  selector: 'app-feedback-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './feedback-detail-dialog.component.html',
  styleUrls: ['./feedback-detail-dialog.component.css']
})
export class FeedbackDetailDialogComponent {
  feedback: Feedback;
  isUpdating = false;
  adminNotes = '';
  
  statusOptions = [
    { value: 'pending', label: 'Pendiente', icon: 'pending', color: 'warn' },
    { value: 'in_progress', label: 'En progreso', icon: 'hourglass_empty', color: 'accent' },
    { value: 'resolved', label: 'Resuelto', icon: 'check_circle', color: 'primary' },
    { value: 'closed', label: 'Cerrado', icon: 'cancel', color: '' }
  ];

  constructor(
    public dialogRef: MatDialogRef<FeedbackDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { feedback: Feedback },
    private supabaseService: SupabaseService,
    private snackBar: MatSnackBar
  ) {
    this.feedback = { ...data.feedback };
    this.adminNotes = this.feedback.admin_notes || '';
  }

  async updateFeedbackStatus(): Promise<void> {
    this.isUpdating = true;
    try {
      const adminId = await this.getCurrentAdminId();
      const updates: Partial<Feedback> = {
        status: this.feedback.status,
        admin_notes: this.adminNotes || undefined,
        assigned_to: adminId || undefined
      };

      if (this.feedback.status === 'resolved' || this.feedback.status === 'closed') {
        updates.resolution_date = new Date().toISOString();
      }

      const updatedFeedback = await this.supabaseService.updateFeedback(this.feedback.id, updates);
      
      this.snackBar.open('Reporte actualizado exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });

      this.dialogRef.close({ updated: true, feedback: updatedFeedback });
    } catch (error) {
      console.error('Error updating feedback:', error);
      this.snackBar.open('Error al actualizar el reporte', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isUpdating = false;
    }
  }

  private async getCurrentAdminId(): Promise<string | null> {
    try {
      const user = await this.supabaseService.getCurrentUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current admin ID:', error);
      return null;
    }
  }

  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find(opt => opt.value === status);
    return statusOption?.color || '';
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(opt => opt.value === status);
    return statusOption?.label || status;
  }

  getStatusIcon(status: string): string {
    const statusOption = this.statusOptions.find(opt => opt.value === status);
    return statusOption?.icon || 'help';
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

  getUrgencyLabel(urgency: string): string {
    switch (urgency) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return urgency;
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  hasChanges(): boolean {
    return this.feedback.status !== this.data.feedback.status || 
           this.adminNotes !== (this.data.feedback.admin_notes || '');
  }

  openImageModal(imageUrl: string): void {
    // Open image in a new window/tab for full view
    window.open(imageUrl, '_blank');
  }
}
