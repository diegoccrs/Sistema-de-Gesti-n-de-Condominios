import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, UserProfileButtonComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {

}
