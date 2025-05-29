import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';

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
    private dialog = inject(MatDialog);
    private readonly authService = inject(AuthService);
    user: any = null;

    async ngOnInit() {
        const { data, error } = await this.authService.supabase.auth.getUser();
        if (!error) this.user = data.user;
    }

    onEditProfile() {
        // Navega o abre modal de edición
        this.dialog.open(EditProfileDialogComponent, {
            width: '400px',
        });
    }

    async onLogout() {
        await this.authService.supabase.auth.signOut();
        window.location.href = '/login';
    }
}