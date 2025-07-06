import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SupabaseService } from '../../../../../../supabase/backend/infrastructure/supabase.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-select-resident-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './select-resident-dialog.component.html',
  styleUrl: './select-resident-dialog.component.css',
})
export class SelectResidentDialogComponent implements OnInit {
  searchControl = new FormControl('');
  residents: any[] = [];
  filteredResidents: any[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private dialogRef: MatDialogRef<SelectResidentDialogComponent>
  ) {}

  async ngOnInit() {
    this.residents = await this.supabaseService.getAllResidents(); // Método que obtenga perfiles
    this.filteredResidents = [...this.residents];

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
      const term = value?.toLowerCase() || '';
      this.filteredResidents = this.residents.filter(res =>
        `${res.first_name} ${res.last_name}`.toLowerCase().includes(term)
      );
    });
  }

  selectResident(resident: any) {
    this.dialogRef.close(resident);
  }

  close() {
    this.dialogRef.close(null);
  }

  // Función para generar colores aleatorios para los avatares
getRandomColor(id: number): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F06292', '#7986CB', '#9575CD'
  ];
  return colors[id % colors.length];
}
}
