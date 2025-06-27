import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentService } from '../../../core/services/document.service';
import { DOCUMENT_CATEGORIES } from '../../../core/models/document.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upload-document-dialog',
  templateUrl: './upload-document-dialog.component.html',
  styleUrls: ['./upload-document-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ]
})
export class UploadDocumentDialogComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  documentCategories = DOCUMENT_CATEGORIES;
  isUploading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UploadDocumentDialogComponent>,
    private documentService: DocumentService
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Basic validation for file types
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
          this.errorMessage = 'Invalid file type. Please upload a PDF, Word, or Excel file.';
          this.selectedFile = null;
          this.uploadForm.get('file')?.setValue(null);
      } else {
          this.errorMessage = null;
      }
    }
  }

  async onUpload(): Promise<void> {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.errorMessage = 'Please fill out all required fields and select a file.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = null;

    try {
      await this.documentService.uploadDocument(this.selectedFile, {
        title: this.uploadForm.value.title,
        description: this.uploadForm.value.description,
        category: this.uploadForm.value.category
      });
      this.dialogRef.close(true); // Close dialog and signal success
    } catch (error) {
      console.error('Upload failed', error);
      this.errorMessage = 'Upload failed. Please try again.';
    } finally {
      this.isUploading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}