// src/app/features/resident/neighbor-directory/neighbor-directory.component.ts
// src/app/features/resident/neighbor-directory/neighbor-directory.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar'; // Importar MatToolbarModule
import { MatDividerModule } from '@angular/material/divider'; // Importar MatDividerModule
import { MatSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { SupabaseService, ProfileWithApartmentInfo } from '../../../../core/infrastructure/supabase/supabase.service'; // Ajusta esta ruta si es diferente
import { Profile } from '../../../../core/domain/models/profile.model'; // Ajusta esta ruta si es diferente

import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({

  selector: 'app-neighbor-directory',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule, // Añadir a imports
    MatDividerModule, // Añadir a imports
    FormsModule,      // Añadir a imports
  ],
  templateUrl: './neighbor-directory.component.html',
  styleUrls: ['./neighbor-directory.component.css']
})
export class NeighborDirectoryComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  neighbors: ProfileWithApartmentInfo[] = []; // Usar la nueva interfaz
  searchTerm: string = '';
  private searchTerms = new Subject<string>();
  isLoading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit() {
    // Inicializa la búsqueda de perfiles al cargar el componente
    this.searchTerms.pipe(
      debounceTime(300), // Espera 300ms después de cada pulsación para considerar el término
      distinctUntilChanged(), // Ignora si el término de búsqueda es el mismo
      switchMap((term: string) => {
        this.isLoading = true; // Muestra spinner al iniciar la búsqueda
        this.errorMessage = null; // Limpia errores anteriores
        return this.supabaseService.searchProfiles(term); // Llama al nuevo método
      })
    ).subscribe({
      next: (data) => {
        this.neighbors = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error searching neighbors:', err);
        this.errorMessage = 'No se pudieron cargar los vecinos. Intente de nuevo más tarde.';
        this.isLoading = false;
      }
    });

    // Carga inicial de todos los perfiles (sin término de búsqueda)
    this.searchTerms.next('');
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerms.next(searchTerm);
  }
}