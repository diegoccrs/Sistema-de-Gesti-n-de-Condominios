import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule si necesitas directivas como *ngIf, *ngFor
// Importa cualquier otro módulo que tus componentes hijos o directivas necesiten,
// o si el DashboardComponent usa pipes o componentes de otros módulos.

@Component({
  selector: 'app-dashboard',
  standalone: true, 
  imports: [CommonModule], // Aquí importas los módulos o componentes standalone que necesites usar dentro de tu DashboardComponent
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'] // o './dashboard.component.scss'
})
export class DashboardComponent {
  constructor() {
    // Lógica inicial del constructor
  }
}