// src/app/dashboard/components/admin-dashboard/assign-debt-dialog/assign-debt-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assign-debt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './assign-debt-dialog.component.html',
  styleUrls: ['./assign-debt-dialog.component.css']
})
export class AssignDebtDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignDebtDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { residentId: string }
  ) {
    this.form = this.fb.group({
      concept: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['VES', Validators.required],
      payment_date: [new Date(), Validators.required]
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close({ ...this.form.value, resident_id: this.data.residentId });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
