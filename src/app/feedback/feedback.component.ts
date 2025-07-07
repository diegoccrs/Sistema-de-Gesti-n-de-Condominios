import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '@backend/infrastructure/supabase.service';
import { CreateFeedbackRequest } from '@backend/models/feedback.model';

const FEEDBACK_CATEGORIES = [
  'Problema Técnico',
  'Problema de Mantenimiento',
  'Problema de Seguridad',
  'Problema de Limpieza',
  'Ruido',
  'Vecinos',
  'Administración',
  'Sugerencia',
  'Otro'
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
];

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class FeedbackComponent implements OnInit {
  feedbackForm: FormGroup;
  isLoading = false;
  isAdmin = false;
  categories = FEEDBACK_CATEGORIES;
  urgencyLevels = URGENCY_LEVELS;
  selectedFiles: File[] = [];
  maxFiles = 3;
  maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private supabaseService: SupabaseService
  ) {
    this.feedbackForm = this.fb.group({
      category: ['', [Validators.required]],
      urgency: ['medium', [Validators.required]],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      location: ['', [Validators.maxLength(200)]],
      contactInfo: ['', [Validators.maxLength(200)]]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.checkUserRole();
  }

  async checkUserRole(): Promise<void> {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const profile = await this.supabaseService.getProfile(user.id);
        this.isAdmin = profile?.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      this.isAdmin = false;
    }
  }

  async submitFeedback(): Promise<void> {
    if (this.feedbackForm.valid) {
      this.isLoading = true;
      
      try {
        const user = await this.supabaseService.getCurrentUser();
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        const feedbackRequest: CreateFeedbackRequest = {
          title: this.feedbackForm.value.title,
          description: this.feedbackForm.value.description,
          category: this.feedbackForm.value.category,
          urgency: this.feedbackForm.value.urgency,
          location: this.feedbackForm.value.location,
          contact_info: this.feedbackForm.value.contactInfo,
          image_files: this.selectedFiles.length > 0 ? this.selectedFiles : undefined
        };

        // Save to database
        const savedFeedback = await this.supabaseService.createFeedback(feedbackRequest, user.id);
        
        console.log('Feedback saved successfully:', savedFeedback);

        this.snackBar.open(
          `Reporte enviado exitosamente. ID de seguimiento: ${savedFeedback.id.slice(0, 8)}...`, 
          'Cerrar', 
          {
            duration: 5000,
            panelClass: ['snackbar-success']
          }
        );

        this.resetForm();
        this.selectedFiles = [];

      } catch (error: any) {
        console.error('Error submitting feedback:', error);
        this.snackBar.open(
          `Error al enviar el reporte: ${error.message || 'Error desconocido'}`, 
          'Cerrar', 
          {
            duration: 5000,
            panelClass: ['snackbar-error']
          }
        );
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.feedbackForm.controls).forEach(key => {
      const control = this.feedbackForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.feedbackForm.get(fieldName);
    if (control && control.invalid && control.touched) {
      if (control.errors?.['required']) {
        return 'Este campo es obligatorio';
      }
      if (control.errors?.['maxlength']) {
        return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return null;
  }

  resetForm(): void {
    this.feedbackForm.reset();
    this.feedbackForm.patchValue({ urgency: 'medium' });
    this.selectedFiles = [];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Validate file count
      if (this.selectedFiles.length + files.length > this.maxFiles) {
        this.snackBar.open(
          `Máximo ${this.maxFiles} imágenes permitidas`, 
          'Cerrar', 
          { duration: 3000, panelClass: ['snackbar-error'] }
        );
        return;
      }
      
      // Validate file types and sizes
      const validFiles: File[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          this.snackBar.open(
            `${file.name} no es una imagen válida`, 
            'Cerrar', 
            { duration: 3000, panelClass: ['snackbar-error'] }
          );
          continue;
        }
        
        if (file.size > this.maxFileSize) {
          this.snackBar.open(
            `${file.name} es muy grande (máximo 5MB)`, 
            'Cerrar', 
            { duration: 3000, panelClass: ['snackbar-error'] }
          );
          continue;
        }
        
        validFiles.push(file);
      }
      
      this.selectedFiles.push(...validFiles);
      
      // Clear the input
      input.value = '';
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  getFilePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  goBack(): void {
    if (this.isAdmin) {
      this.router.navigate(['/dashboard/admin-home']);
    } else {
      this.router.navigate(['/dashboard/resident-home']);
    }
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'low': return 'primary';
      case 'medium': return 'accent';
      case 'high': return 'warn';
      case 'urgent': return 'warn';
      default: return 'primary';
    }
  }
}
