import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// ⚠️ Ajusta la ruta si tu AuthService está en otra carpeta
import { AuthService } from '../../../../auth/auth.service';

@Component({
    selector: 'app-user-profile-button',
    standalone: true,
    imports: [
        CommonModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
    ],
    templateUrl: './user-profile-button.component.html',
    styleUrls: ['./user-profile-button.component.css']
})
export class UserProfileButtonComponent implements OnInit {
    private readonly authService = inject(AuthService);
    user: any = null;

    async ngOnInit() {
        const { data, error } = await this.authService.supabase.auth.getUser();
        if (!error) this.user = data.user;
    }

    onEditProfile() {
        // Navega o abre modal de edición
        alert('Funcionalidad de editar perfil aún no implementada.');
    }

    async onLogout() {
        await this.authService.supabase.auth.signOut();
        window.location.href = '/login';
    }
}