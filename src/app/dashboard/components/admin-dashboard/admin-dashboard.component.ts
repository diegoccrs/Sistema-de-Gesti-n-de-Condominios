import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { AnuncioComponent } from '../../../auth/anuncio/anuncio.component';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, UserProfileButtonComponent, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {

}