import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil, finalize } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { BusinessService } from '../../../../core/services/business.service';
import { Category } from '../../../../core/models/menu.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // LoadingSpinnerComponent
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  categoryId: string | null = null;
  currentCategory: Category | null = null;
  
  // Image upload
  imagePreview: string | null = null;
  isUploadingImage = false;
  selectedFile: File | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private toastr: ToastrService
  ) {
    this.categoryForm = this.createForm();
  }

ngOnInit(): void {
  console.log('🔵 CategoryFormComponent inicializado');
  console.log('🔵 Ruta actual:', this.router.url);
  
  this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
    console.log('🔵 Params recibidos:', params);
    console.log('🔵 ID de categoría:', params['id']);
    
    this.categoryId = params['id'];
    this.isEditMode = !!this.categoryId;
    
    console.log('🔵 Modo edición:', this.isEditMode);
    
    if (this.isEditMode && this.categoryId) {
      console.log('🔵 Cargando categoría con ID:', this.categoryId);
      this.loadCategory(this.categoryId);
    } else {
      console.log('🔵 Modo creación de nueva categoría');
      console.log('🔵 Valor del formulario:', this.categoryForm.value);
    }
  });
  
  // También verifica el formulario
  console.log('🔵 Formulario creado:', this.categoryForm);
  console.log('🔵 Controles del formulario:', this.categoryForm.controls);
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      display_order: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
      cover_image_url: ['']
    });
  }

  private loadCategory(id: string): void {
    this.isLoading = true;
    
    this.categoryService.getCategoryById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (category: any) => {
          this.currentCategory = category;
          this.categoryForm.patchValue(category);
          this.imagePreview = category.cover_image_url || null;
        },
        error: (error: any) => {
          console.error('Error loading category:', error);
          this.toastr.error('Error al cargar la categoría', 'Error');
          this.router.navigate(['/business/categories']);
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.toastr.error('Solo se permiten imágenes JPG, PNG, WebP o GIF', 'Error');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastr.error('La imagen no puede superar los 5MB', 'Error');
      return;
    }

    this.selectedFile = file;
    this.isUploadingImage = true;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.isUploadingImage = false;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.categoryForm.patchValue({ cover_image_url: '' });
  }

  uploadImage(file: File): void {
    this.isUploadingImage = true;
    
    // this.businessService.uploadCategoryImage(file)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response: any) => {
    //       this.isUploadingImage = false;
    //       this.categoryForm.patchValue({ cover_image_url: response.url });
    //       this.toastr.success('Imagen subida correctamente', 'Éxito');
    //     },
    //     error: (error: any) => {
    //       this.isUploadingImage = false;
    //       console.error('Error uploading image:', error);
    //       this.toastr.error('Error al subir la imagen', 'Error');
    //     }
    //   });
  }

  get formTitle(): string {
    return this.isEditMode ? 'Editar Categoría' : 'Nueva Categoría';
  }

  get submitButtonText(): string {
    return this.isSubmitting 
      ? (this.isEditMode ? 'Actualizando...' : 'Creando...') 
      : (this.isEditMode ? 'Actualizar Categoría' : 'Crear Categoría');
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched(this.categoryForm);
      this.toastr.error('Por favor, completa los campos requeridos', 'Error');
      return;
    }

    this.isSubmitting = true;
    const formData = this.categoryForm.value;

    // Handle image upload if a new file is selected
    if (this.selectedFile) {
      this.uploadImage(this.selectedFile);
    }

    if (this.isEditMode && this.categoryId) {
      //Update category
      this.categoryService.updateCategory(this.categoryId, formData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (response: any) => {
            this.toastr.success('Categoría actualizada correctamente', 'Éxito');
            this.router.navigate(['/business/categories']);
          },
          error: (error: any) => {
            console.error('Error updating category:', error);
            this.toastr.error('Error al actualizar la categoría', 'Error');
          }
        });
    } else {
      // Create category
      this.categoryService.createCategory(formData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (response: any) => {
            this.toastr.success('Categoría creada correctamente', 'Éxito');
            this.router.navigate(['/business/categories']);
          },
          error: (error: any) => {
            console.error('Error creating category:', error);
            this.toastr.error('Error al crear la categoría', 'Error');
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/business/categories']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.categoryForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }
}