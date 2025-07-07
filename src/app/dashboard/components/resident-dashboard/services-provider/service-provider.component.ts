// src/app/service-providers/service-providers.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../../../supabase/backend/infrastructure/supabase.service';
import { ServiceProvider } from '../../../../../../supabase/backend/models/service-provider.model';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
    selector: 'app-service-providers',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        FormsModule,
    ], // Importa CommonModule para usar directivas comunes de Angular
    templateUrl: './service-provider.component.html',
    styleUrls: ['./service-provider.component.css']
})
export class ServiceProvidersComponent implements OnInit {
    serviceProviders: ServiceProvider[] = [];
    filteredServiceProviders: ServiceProvider[] = [];
    searchTerm: string = '';
    isLoading: boolean = true;
    errorMessage: string | null = null;
    private searchSubject = new Subject<string>();

    constructor(private supabaseService: SupabaseService) { }

    ngOnInit(): void {
        this.loadServiceProviders();

        this.searchSubject.pipe(
            debounceTime(300)
        ).subscribe(term => {
            this.filterProviders(this.searchTerm)
        })
    }

    filterProviders(term: string): void {
        const lowerCaseTerm = term.toLowerCase();
        if (!lowerCaseTerm) {
            this.filteredServiceProviders = [...this.serviceProviders]; // Si el término está vacío, muestra todos
        } else {
            this.filteredServiceProviders = this.serviceProviders.filter(provider =>
                provider.name.toLowerCase().includes(lowerCaseTerm) ||
                provider.service_type.toLowerCase().includes(lowerCaseTerm) ||
                (provider.description && provider.description.toLowerCase().includes(lowerCaseTerm))
            );
        }
    }

    // Nuevo método para manejar el cambio en el input de búsqueda
    onSearchTermChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.searchSubject.next(inputElement.value); // Emite el valor del input al Subject
    }


    async loadServiceProviders(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            const data = await this.supabaseService.getServiceProviders();
            if (data) {
                this.serviceProviders = data;
                this.filterProviders(this.searchTerm)
            } else {
                this.errorMessage = 'No se pudieron cargar los proveedores de servicios.';
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            this.errorMessage = 'Ocurrió un error inesperado al obtener los proveedores.';
        } finally {
            this.isLoading = false;
        }
    }
    goBack(): void {
        window.history.back(); // Navega hacia atrás en el historial del navegador
    }
}