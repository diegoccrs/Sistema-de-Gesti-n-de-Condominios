import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // No se usará routerLink directamente
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog'; // Importar MatDialog
import { MatSnackBar } from '@angular/material/snack-bar'; // Para notificaciones de éxito/error

import { CreateResidentFormDialogComponent } from '../create-resident-form-dialog/create-resident-form-dialog.component'; // Importar el nuevo componente de diálogo

@Component({
  selector: 'app-admin-create-resident', // Mantén el selector si lo usas en algún lugar
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    // MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatProgressSpinnerModule ya no son necesarios aquí
  ],
  templateUrl: './admin-create-resident.component.html',
  styleUrls: ['./admin-create-resident.component.css']
})
export class AdminCreateResidentComponent implements OnInit {
  // private router = inject(Router); // No es necesario si solo abre diálogos

  constructor(
    private dialog: MatDialog, // Inyectar MatDialog service
    private snackBar: MatSnackBar // Para mostrar mensajes de resultado
  ) { }

  ngOnInit(): void {
    // No hay formulario aquí, se inicializa al abrir el diálogo
  }

  openCreateResidentDialog(): void {
    const dialogRef = this.dialog.open(CreateResidentFormDialogComponent, {
      width: '500px', // Ancho deseado para el diálogo
      disableClose: true, // Opcional: no permite cerrar el diálogo haciendo clic fuera o con Esc
      // data: {} // Si necesitaras pasar datos al diálogo, irían aquí
    });

    dialogRef.afterClosed().subscribe(result => {
      // El 'result' es lo que devuelve el diálogo al cerrarse (por ejemplo, { success: true, message: '...' })
      if (result && result.success) {
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success'] // Clase CSS para estilos de éxito
        });
      } else if (result && result.message) { // Si hay un mensaje de error desde el diálogo
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 7000,
          panelClass: ['snackbar-error'] // Clase CSS para estilos de error
        });
      } else if (result === undefined) {
        // El diálogo se cerró sin enviar nada (ej. clic en Cancelar o Esc)
        this.snackBar.open('Creación de residente cancelada.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}