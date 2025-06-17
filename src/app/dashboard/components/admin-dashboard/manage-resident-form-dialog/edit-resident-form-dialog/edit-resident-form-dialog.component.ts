import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../../../core/infrastructure/supabase/supabase.service';
import { Profile } from '../../../../../core/domain/models/profile.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Building } from '../../../../../core/domain/models/building.model';
import { Apartment } from '../../../../../core/domain/models/apartment.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-edit-resident-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressBarModule
  ],
  templateUrl: './edit-resident-form-dialog.component.html',
  styleUrls: ['./edit-resident-form-dialog.component.css']
})
export class EditResidentFormDialogComponent implements OnInit {
  editForm: FormGroup;
  isLoading = false;
  isDeleting = false;
  buildings: Building[] = [];
  apartments: Apartment[] = [];
  allApartments: Apartment[] = [];
  filteredApartments: Apartment[] = [];
  selectedApartments: string[] = [];
  isLoadingApartments = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EditResidentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { resident: Profile }
  ) {
    this.editForm = this.fb.group({
      first_name: [data.resident.first_name || '', [Validators.required, Validators.maxLength(50)]],
      last_name: [data.resident.last_name || '', [Validators.required, Validators.maxLength(50)]],
      selectedBuildingIds: [[]], // Añadir este control
      selectedApartmentIds: [[]] // Añadir este control
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      // Cargar edificios
      this.buildings = await this.supabaseService.getBuildings() || [];

      // Cargar todos los apartamentos
      this.isLoadingApartments = true;
      this.allApartments = await this.supabaseService.getApartments() || [];

      // Cargar apartamentos actuales del residente
      const currentApartments = await this.supabaseService.getProfileApartments(this.data.resident.id) || [];
      const currentApartmentIds = currentApartments.map(a => a.id);

      // Obtener IDs de edificios de los apartamentos actuales
      const currentBuildingIds = [...new Set(
        currentApartments
          .map(a => a.building_id)
          .filter(id => id !== undefined) as string[]
      )];
      console.log('Current Building IDs:', currentBuildingIds);

      // --- CORRECCIÓN AQUÍ ---
      // Preseleccionar edificios sin disparar el evento valueChanges
      this.editForm.get('selectedBuildingIds')?.setValue(currentBuildingIds, { emitEvent: false });

      // Filtrar apartamentos y preseleccionar
      this.filterApartmentsByBuildings(currentBuildingIds);
      this.editForm.get('selectedApartmentIds')?.setValue(currentApartmentIds);

    } catch (error: any) {
      console.error('Error loading data:', error);
      this.snackBar.open('Error al cargar datos de edificios y apartamentos', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isLoadingApartments = false;
    }

    // Suscribirse a cambios HECHOS POR EL USUARIO de edificios seleccionados
    this.editForm.get('selectedBuildingIds')?.valueChanges.subscribe(selectedIds => {
      this.filterApartmentsByBuildings(selectedIds);
    });
  }

  filterApartmentsByBuildings(selectedBuildingIds: string[]): void {
    if (!selectedBuildingIds || selectedBuildingIds.length === 0) {
      this.filteredApartments = [];
      // Limpiar apartamentos seleccionados si no hay edificios seleccionados
      this.editForm.get('selectedApartmentIds')?.setValue([]);
      return;
    }

    this.filteredApartments = this.allApartments.filter(apartment =>
      selectedBuildingIds.includes(apartment.building_id)
    );

    // Filtrar apartamentos seleccionados que ya no pertenecen a los edificios seleccionados
    const selectedApartmentIds: string[] = this.editForm.get('selectedApartmentIds')?.value || [];
    const validApartmentIds = selectedApartmentIds.filter(id =>
      this.filteredApartments.some(a => a.id === id)
    );
    if (selectedApartmentIds.length !== validApartmentIds.length) {
      this.editForm.get('selectedApartmentIds')?.setValue(validApartmentIds);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.editForm.invalid) {
      this.snackBar.open('Por favor, complete todos los campos requeridos.', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    this.isLoading = true;
    try {
      // Actualizar datos básicos del residente
      const updates = {
        first_name: this.editForm.value.first_name,
        last_name: this.editForm.value.last_name
      };

      await this.supabaseService.updateProfile(this.data.resident.id, updates);

      // Actualizar apartamentos asignados
      const selectedApartmentIds = this.editForm.value.selectedApartmentIds;
      await this.supabaseService.updateProfileApartments(
        this.data.resident.id,
        selectedApartmentIds
      );

      // Actualizar estado de ocupación de los apartamentos
      await this.supabaseService.updateApartmentOccupancy(selectedApartmentIds, true);

      this.snackBar.open('Residente actualizado con éxito!', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });

      this.dialogRef.close({
        success: true,
        message: 'Residente actualizado correctamente',
        updatedResident: {
          ...this.data.resident,
          ...updates,
          // Agregar info de apartamentos para actualizar la UI
          apartment_info: this.filteredApartments
            .filter(a => selectedApartmentIds.includes(a.id))
            .map(a => ({
              apartment_number: a.apartment_number,
              floor: a.floor,
              building_name: this.buildings.find(b => b.id === a.building_id)?.name
            }))
        }
      });
    } catch (error: any) {
      console.error('Error actualizando residente:', error);
      this.snackBar.open(`Error: ${error.message || 'No se pudo actualizar el residente'}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isLoading = false;
    }
  }

  async onDelete(): Promise<void> {
    if (!confirm(`¿Está seguro que desea eliminar a ${this.data.resident.first_name} ${this.data.resident.last_name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.isDeleting = true;
    try {
      // Obtener apartamentos actuales para liberarlos
      const currentApartments = await this.supabaseService.getProfileApartments(this.data.resident.id) || [];
      const apartmentIds = currentApartments.map(a => a.id);

      // Eliminar relaciones primero
      await this.supabaseService.updateProfileApartments(this.data.resident.id, []);

      // Liberar apartamentos
      await this.supabaseService.updateApartmentOccupancy(apartmentIds, false);

      // Eliminar perfil
      await this.supabaseService.deleteProfile(this.data.resident.id);

      this.snackBar.open('Residente eliminado con éxito!', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });

      this.dialogRef.close({
        success: true,
        message: 'Residente eliminado correctamente',
        deleted: true,
        residentId: this.data.resident.id
      });
    } catch (error: any) {
      console.error('Error eliminando residente:', error);
      this.snackBar.open(`Error: ${error.message || 'No se pudo eliminar el residente'}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isDeleting = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}