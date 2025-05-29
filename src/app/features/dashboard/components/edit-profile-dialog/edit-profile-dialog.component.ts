import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-edit-profile-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    templateUrl: './edit-profile-dialog.component.html',
    styleUrls: ['./edit-profile-dialog.component.css'],
})
export class EditProfileDialogComponent {
    private authService = inject(AuthService);
    private dialogRef = inject(MatDialogRef<EditProfileDialogComponent>);
    private fb = inject(FormBuilder);

    form: FormGroup = this.fb.group({
        full_name: ['', Validators.required],
        new_password: [''],
    });

    async ngOnInit() {
        const { data } = await this.authService.supabase.auth.getUser();
        const currentName = data.user?.user_metadata?.['full_name'] || '';
        this.form.patchValue({ full_name: currentName });
    }

    async saveChanges() {
        const name = this.form.value.full_name;
        const password = this.form.value.new_password;

        await this.authService.updateUserMetadata(name);
        if (password) await this.authService.updatePassword(password);

        this.dialogRef.close();
    }

    cancel() {
        this.dialogRef.close();
    }
}
