// src/app/condo-rules-page/condo-rules-page.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; // Para sanitizar HTML
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; // Para mostrar las normas de forma expandible
import { MatCardModule } from '@angular/material/card'; // Para el contenedor general
import { MatButtonModule } from '@angular/material/button'; // Para el botón de regresar

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router'; // Para la navegación

import { CondoRules } from '../../../core/domain/models/condo-rules.model';
import { STATIC_CONDO_RULES } from '../../../core/data/static-condo-rules'; // Importa tus datos estáticos

@Component({
    selector: 'app-condo-rules-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatExpansionModule,
        MatCardModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './condo-rules-page.component.html',
    styleUrls: ['./condo-rules-page.component.css']
})
export class CondoRulesPageComponent implements OnInit {
    allCondoRules: CondoRules[] = [];
    filteredCondoRules: CondoRules[] = [];
    searchTerm: string = '';
    isLoading: boolean = true; // Simula una carga, aunque sea de datos estáticos
    errorMessage: string | null = null;

    constructor(
        private sanitizer: DomSanitizer,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Simula una carga asíncrona de datos
        setTimeout(() => {
            try {
                this.allCondoRules = STATIC_CONDO_RULES.map(rule => ({
                    ...rule,
                    content_html: this.sanitizer.bypassSecurityTrustHtml(rule.content_html) as string // Sanitiza el HTML
                })) as CondoRules[]; // Asegura el tipo
                this.applyFilter(); // Aplica el filtro inicial (muestra todo)
            } catch (error) {
                console.error('Error al cargar las normas estáticas:', error);
                this.errorMessage = 'Ocurrió un error al cargar las normas del condominio.';
            } finally {
                this.isLoading = false;
            }
        }, 500); // Pequeño retraso para simular carga
    }

    applyFilter(): void {
        if (!this.searchTerm || this.searchTerm.trim() === '') {
            this.filteredCondoRules = [...this.allCondoRules];
        } else {
            const lowerCaseSearchTerm = this.searchTerm.toLowerCase().trim();
            this.filteredCondoRules = this.allCondoRules.filter(rule => {
                const title = (rule.title ?? '').toString().toLowerCase();
                // Si content_html es SafeHtml, no se puede hacer toLowerCase directamente
                let content = '';
                if (typeof rule.content_html === 'string') {
                    content = rule.content_html.toLowerCase();
                }
                return title.includes(lowerCaseSearchTerm) || content.includes(lowerCaseSearchTerm);
            });
        }
    }

    // Método para regresar a la página anterior
    goBack(): void {
        window.history.back(); // Navega hacia atrás en el historial del navegador
    }
}