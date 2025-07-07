import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon'; // Importado para usar <mat-icon>

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        RouterModule,
        MatIconModule 
    ],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent { }