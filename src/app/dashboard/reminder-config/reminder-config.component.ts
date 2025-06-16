import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReminderConfigService } from '../../core/reminder-config.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reminder-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './reminder-config.component.html',
  styleUrls: ['./reminder-config.component.css']
})
export class ReminderConfigComponent {
  form: ReturnType<FormBuilder['group']>;
  success = false;

  constructor(
    private fb: FormBuilder,
    private configService: ReminderConfigService,
    private dialogRef: MatDialogRef<ReminderConfigComponent>
  ) {
    this.form = this.fb.group({
      days_late: [3, [Validators.required, Validators.min(1)]],
      send_time: ['09:00', Validators.required],
      active: [true]
    });
  }

  async save(): Promise<void> {
    const config = this.form.value;
    await this.configService.addReminderConfig(config);
    this.success = true;
    this.form.reset({ days_late: 3, send_time: '09:00', active: true });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
