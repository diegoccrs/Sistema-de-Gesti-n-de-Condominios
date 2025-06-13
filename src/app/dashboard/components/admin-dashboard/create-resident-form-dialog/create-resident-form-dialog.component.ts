// src/app/modules/dashboard/components/create-resident-form-dialog/create-resident-form-dialog.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select'; // <-- Importar MatSelectModule
import { MatOptionModule } from '@angular/material/core'; // <-- Importar MatOptionModule

// Importar el SupabaseService (asumiendo que está en 'src/app/services/supabase.service.ts')
import { SupabaseService } from '../../../../core/infrastructure/supabase/supabase.service'; // ✅ RUTA CORREGIDA según tu estructura

// Importar los modelos necesarios (asegúrate de que las rutas sean correctas para ti)
import { Building } from '../../../../core/domain/models/building.model';
import { Apartment } from '../../../../core/domain/models/apartment.model';
import { ProfileApartment } from '../../../../core/domain/models/profile-apartment.model';
import { User } from '@supabase/supabase-js'; // Para tipar el usuario de Supabase Auth

@Component({
  selector: 'app-create-resident-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule, // Añadir MatSelectModule
    MatOptionModule  // Añadir MatOptionModule
  ],
  templateUrl: './create-resident-form-dialog.component.html',
  styleUrls: ['./create-resident-form-dialog.component.css']
})
export class CreateResidentFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  // ✅ Inyectar el SupabaseService en lugar de crear un cliente local
  private supabaseService = inject(SupabaseService);

  createResidentForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  buildings: Building[] = [];
  allAvailableApartments: Apartment[] = [];
  filteredApartments: Apartment[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateResidentFormDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.createResidentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      // ✅ Nuevos campos para selección de edificios y apartamentos
      selectedBuildingIds: [[], Validators.required],
      selectedApartmentIds: [[], Validators.required],
    
    });

    this.loadBuildings();
    this.loadAllAvailableApartments();

    // ✅ Suscribirse a los cambios de 'selectedBuildingIds' para filtrar apartamentos
    this.createResidentForm.get('selectedBuildingIds')?.valueChanges.subscribe(selectedIds => {
      this.filterApartmentsByBuildings(selectedIds);
      // Limpiar la selección de apartamentos cuando cambian los edificios
      this.createResidentForm.get('selectedApartmentIds')?.setValue([]);
    });
  }

  // ✅ Método para cargar edificios
  async loadBuildings(): Promise<void> {
    try {
      this.buildings = await this.supabaseService.getBuildings();
    } catch (error: any) {
      console.error('Error al cargar edificios:', error.message);
      this.errorMessage = 'Error al cargar edificios. Intente de nuevo más tarde.';
    }
  }

  // ✅ Método para cargar todos los apartamentos disponibles (no ocupados)
  async loadAllAvailableApartments(): Promise<void> {
    try {
      // Usar el método getApartments del servicio sin buildingId para obtener todos los disponibles
      this.allAvailableApartments = await this.supabaseService.getApartments();
    } catch (error: any) {
      console.error('Error al cargar apartamentos disponibles:', error.message);
      this.errorMessage = 'Error al cargar apartamentos. Intente de nuevo más tarde.';
    }
  }

  // ✅ Método para filtrar apartamentos basados en los edificios seleccionados
  filterApartmentsByBuildings(selectedBuildingIds: string[]): void {
    if (!selectedBuildingIds || selectedBuildingIds.length === 0) {
      this.filteredApartments = [];
      return;
    }

    this.filteredApartments = this.allAvailableApartments.filter(apartment =>
      selectedBuildingIds.includes(apartment.building_id)
    );
  }

  async onSubmit(): Promise<void> {
    if (this.createResidentForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      this.createResidentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password, firstName, lastName, selectedApartmentIds } = this.createResidentForm.value;

    try {
      // 1. Registrar el usuario en Supabase Auth
      // ✅ Pasamos first_name y last_name en los metadatos de usuario
      const userData = await this.supabaseService.signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        // No pasamos 'apartment' aquí, ya que se maneja a través de profile_apartments
      });

      // El método signUp de tu servicio devuelve 'data' que contiene 'user'
      const newUser: User | null = userData?.user || null;

      if (!newUser) {
        // Si el registro de usuario en auth no devuelve un usuario, pero no hay error
        // (ej. en caso de confirmación por email pendiente)
        this.successMessage = '✅ Registro exitoso. Por favor, revise su correo electrónico para confirmar su cuenta.';
        this.dialogRef.close({ success: true, message: this.successMessage });
        return;
      }

      const userId = newUser.id; // El ID del usuario recién creado

      // 2. Crear las relaciones en la tabla 'profile_apartments'
      const relationshipsToInsert: Omit<ProfileApartment, 'created_at'>[] = selectedApartmentIds.map((apartmentId: string) => ({
        profile_id: userId,
        apartment_id: apartmentId,
        
      }));

      await this.supabaseService.createProfileApartments(relationshipsToInsert); //

      // 3. Actualizar el estado de ocupación de los apartamentos
      await this.supabaseService.updateApartmentOccupancy(selectedApartmentIds, true);

      this.dialogRef.close({ success: true, message: '✅ Residente registrado y asignado exitosamente.' });

    } catch (error: any) {
      console.error('Error al registrar residente:', error);
      if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        this.errorMessage = 'Este correo electrónico ya está registrado.';
      } else if (error.message.includes('AuthApiError: Password should be at least')) {
        this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
      } else {
        this.errorMessage = `Error al registrar: ${error.message}`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}