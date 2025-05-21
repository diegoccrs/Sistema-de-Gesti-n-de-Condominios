import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabaseUrl = 'https://rimuwztixsaxiaznzfdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc';
const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    fb = inject(FormBuilder);

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
    });

    async login() {
        if (this.loginForm.invalid) return;

        const { email, password } = this.loginForm.value;
        const { error } = await supabase.auth.signInWithPassword({
            email: email!,
            password: password!
        });

        if (error) {
            alert('Error de inicio de sesión: ' + error.message);
        } else {
            alert('Inicio de sesión exitoso');
            // redirigir al dashboard, por ejemplo
        }
    }
}