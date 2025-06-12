// src/app/features/resident/neighbor-directory/neighbor-directory.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para directivas como *ngIf, *ngFor
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]

import { SupabaseService } from '../../../../core/infrastructure/supabase/supabase.service'; // Ajusta esta ruta si es diferente
import { Profile } from '../../../../core/domain/models/profile.model'; // Ajusta esta ruta si es diferente

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-neighbor-directory',
  standalone: true, // Este componente es standalone
  imports: [ // Importa los módulos necesarios directamente aquí
    CommonModule,
    FormsModule
  ],
  templateUrl: './neighbor-directory.component.html',
  styleUrls: ['./neighbor-directory.component.css']
})
export class NeighborDirectoryComponent implements OnInit {
  searchTerm: string = ''; // Término de búsqueda introducido por el usuario
  neighbors: Profile[] = []; // Lista de vecinos resultante de la búsqueda
  isLoading: boolean = false; // Bandera para controlar el estado de carga
  errorMessage: string | null = null; // Mensaje de error a mostrar si algo sale mal

  // Subject para manejar el término de búsqueda con RxJS, permitiendo debounce
  private searchTerms = new Subject<string>();

  constructor(private supabaseService: SupabaseService) { }

  ngOnInit(): void {
    // Configura el pipeline de RxJS para optimizar las llamadas a la API
    this.searchTerms.pipe(
      debounceTime(300), // Espera 300ms después de la última pulsación de tecla antes de emitir
      distinctUntilChanged() // Solo emite si el término de búsqueda ha cambiado desde la última emisión
    ).subscribe(term => {
      // Realiza la búsqueda si el término tiene al menos 2 caracteres o si está vacío
      // (lo que permitiría mostrar todos los vecinos si así se desea al inicio o al borrar la búsqueda)
      if (term.length >= 2 || term.length === 0) {
        this.performSearch(term);
      } else if (term.length < 2 && term.length > 0) {
        // Si el término es muy corto (ej. 1 carácter) pero no vacío, limpia los resultados
        this.neighbors = [];
      }
    });

    // Opcional: Si quieres cargar todos los vecinos al iniciar el componente sin búsqueda inicial
    // Descomenta la siguiente línea:
    // this.performSearch('');
  }

  /**
   * Se llama cada vez que el valor del input de búsqueda cambia.
   * Emite el nuevo término de búsqueda al Subject.
   */
  onSearchChange(): void {
    this.searchTerms.next(this.searchTerm);
  }

  /**
   * Realiza la llamada asíncrona al servicio de Supabase para buscar perfiles.
   * Controla los estados de carga y error.
   * @param term El término de búsqueda a enviar al servicio.
   */
  async performSearch(term: string): Promise<void> {
    this.isLoading = true; // Activa el indicador de carga
    this.errorMessage = null; // Reinicia el mensaje de error
    this.neighbors = []; // Limpia los resultados anteriores

    try {
      const result = await this.supabaseService.searchProfiles(term);
      if (result) {
        this.neighbors = result; // Asigna los resultados obtenidos
      } else {
        // Esto se ejecutará si el servicio devuelve null por un error interno manejado
        this.errorMessage = 'No se pudo cargar el directorio de vecinos. Inténtalo de nuevo más tarde.';
      }
    } catch (error) {
      console.error('Error en el componente al buscar vecinos:', error);
      this.errorMessage = 'Ocurrió un error inesperado al buscar vecinos. Por favor, intenta de nuevo.';
    } finally {
      this.isLoading = false; // Desactiva el indicador de carga
    }
  }
}