import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog'; 
import { MatSnackBar } from '@angular/material/snack-bar'; 

import { CreateResidentFormDialogComponent } from '../create-resident-form-dialog/create-resident-form-dialog.component'; // Importar el nuevo componente de diálogo

@Component({
  selector: 'app-admin-create-resident', 
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,

  ],
  templateUrl: './admin-create-resident.component.html',
  styleUrls: ['./admin-create-resident.component.css']
})
export class AdminCreateResidentComponent implements OnInit {

  constructor(
    private dialog: MatDialog, 
    private snackBar: MatSnackBar 
  ) { }

  ngOnInit(): void {
    
  }

  openCreateResidentDialog(): void {
    const dialogRef = this.dialog.open(CreateResidentFormDialogComponent, {
      width: '500px', 
      disableClose: true, 
      
    });

    dialogRef.afterClosed().subscribe(result => {
      
      if (result && result.success) {
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success'] 
        });
      } else if (result && result.message) { 
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 7000,
          panelClass: ['snackbar-error'] 
        });
      } else if (result === undefined) {
        
        this.snackBar.open('Creación de residente cancelada.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}