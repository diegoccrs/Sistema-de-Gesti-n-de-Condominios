import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnuncioComponent } from '../../../../auth/anuncio/anuncio.component';
import { RouterModule } from '@angular/router'; // ⚠️ ¡esto es esencial!

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule,  RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
 
  
}