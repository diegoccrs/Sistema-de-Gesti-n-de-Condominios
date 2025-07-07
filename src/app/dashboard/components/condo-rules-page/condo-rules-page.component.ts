// src/app/condo-rules-page/condo-rules-page.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; 
import { MatCardModule } from '@angular/material/card'; 
import { MatButtonModule } from '@angular/material/button';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router'; 

import { CondoRules } from '@backend/models/condo-rules.model';
import { CONDO_RULES } from '@backend/data/static-condo-rules';

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
    isLoading: boolean = true; 
    errorMessage: string | null = null;

    constructor(
        private sanitizer: DomSanitizer,
        private router: Router
    ) { }

    ngOnInit(): void {
        setTimeout(() => {
            try {
                this.allCondoRules = CONDO_RULES.map(rule => ({
                    ...rule,
                    content_html: this.sanitizer.bypassSecurityTrustHtml(rule.content_html) as string // Sanitiza el HTML
                })) as CondoRules[];
                this.applyFilter(); 
            } catch (error) {
                console.error('Error al cargar las normas estáticas:', error);
                this.errorMessage = 'Ocurrió un error al cargar las normas del condominio.';
            } finally {
                this.isLoading = false;
            }
        }, 1000); 
    }

    applyFilter(): void {
        if (!this.searchTerm || this.searchTerm.trim() === '') {
            this.filteredCondoRules = [...this.allCondoRules];
        } else {
            const lowerCaseSearchTerm = this.searchTerm.toLowerCase().trim();
            this.filteredCondoRules = this.allCondoRules.filter(rule => {
                const title = (rule.title ?? '').toString().toLowerCase();
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
        window.history.back(); 
    }
}