import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
);

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatCardModule
    ],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
    fb = inject(FormBuilder);
    router = inject(Router);

    form = this.fb.group({
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', [Validators.required]]
    });

    errorMessage: string | null = null;
    successMessage: string | null = null;
    sessionExists = false;
    submitting = false;

    /** Verificamos que exista una sesión válida (llegó desde el enlace) */
    async ngOnInit() {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
            this.errorMessage =
                'El enlace no es válido o ha expirado. Solicita uno nuevo.';
        } else {
            this.sessionExists = true; // habilita el formulario
        }
    }

    async updatePassword() {
        this.errorMessage = this.successMessage = null;

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        if (this.form.value.password !== this.form.value.confirm) {
            this.errorMessage = 'Las contraseñas no coinciden.';
            return;
        }

        this.submitting = true;
        const { password } = this.form.value;

        const { error } = await supabase.auth.updateUser({ password: password! });
        this.submitting = false;

        if (error) {
            this.errorMessage = 'No se pudo actualizar la contraseña: ' + error.message;
        } else {
            this.successMessage = 'Contraseña actualizada con éxito. Redirigiendo…';
            setTimeout(() => this.router.navigate(['/auth/login']), 3000);
        }
    }
}