import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DocumentService } from '../../../core/services/document.service';
import { Document, DOCUMENT_CATEGORIES } from '../../../core/models/document.model';
import { UploadDocumentDialogComponent } from '../upload-document-dialog/upload-document-dialog.component';
import { SupabaseService } from '../../../core/infrastructure/supabase/supabase.service';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule
  ]
})
export class DocumentsComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  isLoading = false;
  isAdmin = false;
  
  searchForm: FormGroup;
  documentCategories = DOCUMENT_CATEGORIES;
  
  displayedColumns: string[] = ['title', 'category', 'file_name', 'created_at', 'file_size', 'actions'];

  constructor(
    private documentService: DocumentService,
    private supabaseService: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      category: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.checkUserRole();
    await this.loadDocuments();
    
    // Set up real-time search
    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
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
    
    // Keep actions column for all users (they can at least download)
    // Admin users get delete functionality, regular users only get download
  }

  async loadDocuments(): Promise<void> {
    this.isLoading = true;
    try {
      this.documents = await this.documentService.getDocuments();
      this.filteredDocuments = [...this.documents];
    } catch (error) {
      console.error('Error loading documents:', error);
      this.snackBar.open('Error al cargar documentos', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters(): void {
    const { keyword, category } = this.searchForm.value;
    
    this.filteredDocuments = this.documents.filter(doc => {
      const matchesKeyword = !keyword || 
        doc.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(keyword.toLowerCase())) ||
        doc.file_name.toLowerCase().includes(keyword.toLowerCase());
      
      const matchesCategory = !category || doc.category === category;
      
      return matchesKeyword && matchesCategory;
    });
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.filteredDocuments = [...this.documents];
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadDocumentDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Documento subido exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.loadDocuments(); // Reload documents
      }
    });
  }

  async downloadDocument(document: Document): Promise<void> {
    try {
      await this.documentService.downloadDocument(document.file_path, document.file_name);
      this.snackBar.open('Descarga iniciada', 'Cerrar', { duration: 2000 });
    } catch (error) {
      console.error('Error downloading document:', error);
      this.snackBar.open('Error al descargar documento', 'Cerrar', { duration: 3000 });
    }
  }

  async deleteDocument(document: Document): Promise<void> {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${document.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await this.documentService.deleteDocument(document.id, document.file_path);
      this.snackBar.open('Documento eliminado exitosamente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['snackbar-success']
      });
      this.loadDocuments(); // Reload documents
    } catch (error) {
      console.error('Error deleting document:', error);
      this.snackBar.open('Error al eliminar documento', 'Cerrar', { duration: 3000 });
    }
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return 'N/A';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      default:
        return 'insert_drive_file';
    }
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Financial': 'primary',
      'Administrative': 'accent',
      'Meeting Minutes': 'warn',
      'Legal': 'warn',
      'Rules and Regulations': 'primary',
      'Other': ''
    };
    return colors[category] || '';
  }
}
