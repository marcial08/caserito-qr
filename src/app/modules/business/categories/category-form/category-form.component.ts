import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil, finalize, tap, of, Observable } from 'rxjs';

import { CategoryService } from '../../../../core/services/category.service';
import { UploadService } from '../../../../core/services/upload.service';
import { ProductImage } from '../../../../core/models/menu.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  categoryId: number | null = null;

  // Variables para la imagen (usadas en tu HTML)
  imagePreview: string | null = null;
  isUploadingImage = false;
  selectedFiles: File[] = [];

  private businessId = '8d3b46cb-afb7-49f8-bfea-2d64bef2d4eb';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private uploadService: UploadService,
    private toastr: ToastrService,
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      display_order: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.categoryId = +params['id'];
        this.isEditMode = true;
        this.loadCategory(this.categoryId);
      }
    });
  }

  private loadCategory(id: number): void {
    this.isLoading = true;
    this.categoryService
      .getCategoryById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (category: any) => {
          this.categoryForm.patchValue(category);
          // Si la categoría tiene cover_image_url, lo mostramos
          if (category.cover_image_url) {
            this.imagePreview = category.cover_image_url;
          }
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validación básica
    if (!file.type.startsWith('image/')) {
      this.toastr.error('El archivo debe ser una imagen');
      return;
    }

    this.selectedFiles = [file];

    // Preview para el HTML
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);

    // Si estamos en edición, podemos subirla inmediatamente (opcional)
    // O esperar al onSubmit como lo tienes planteado.
  }

  removeImage(): void {
    this.imagePreview = null;
    this.selectedFiles = [];
    // Si quisieras borrarla del servidor inmediatamente, llamarías a un servicio aquí
  }

  private uploadImages(id: number): Observable<any> {
    if (this.selectedFiles.length === 0) return of(null); // Retorna un observable vacío si no hay fotos

    this.isUploadingImage = true;
    return this.uploadService
      .uploadProductImages('category', this.businessId, id, this.selectedFiles)
      .pipe(
        finalize(() => (this.isUploadingImage = false)),
        tap({
          next: () => {
            this.toastr.success('Imagen guardada correctamente');
            this.selectedFiles = [];
          },
          error: () => this.toastr.error('Error al subir la imagen'),
        }),
      );
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched(this.categoryForm);
      return;
    }

    this.isSubmitting = true;
    const formData = {
      ...this.categoryForm.value,
      business_id: this.businessId,
    };

    const request = this.isEditMode
      ? this.categoryService.updateCategory(this.categoryId!, formData)
      : this.categoryService.createCategory(formData);

    request
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: (res: any) => {
          console.log('Respuesta del servidor:', res);
          const id = this.isEditMode ? this.categoryId : res.id; // Asegúrate de que res.data.id sea la ruta correcta

          const finishProcess = () => {
            this.toastr.success(
              `Categoría ${this.isEditMode ? 'actualizada' : 'creada'} con éxito`,
            );
            this.router.navigate(['/business/categories']);
          };

          // Si hay archivos, esperamos a que la subida termine
          if (this.selectedFiles.length > 0 && id) {
            this.uploadImages(id).subscribe({
              next: () => finishProcess(),
              error: () => {
                // Incluso si falla la imagen, quizás quieras navegar o quedarte
                // Aquí decidimos navegar igual pero ya se mostró el error de imagen
                finishProcess();
              },
            });
          } else {
            // Si no hay archivos, navegamos de inmediato
            finishProcess();
          }
        },
        error: (err) => {
          this.toastr.error('Hubo un error al procesar la solicitud');
        },
      });
  }

  // Helpers para el HTML
  get formTitle(): string {
    return this.isEditMode ? 'Editar Categoría' : 'Nueva Categoría';
  }

  onCancel(): void {
    this.router.navigate(['/business/categories']);
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.categoryForm.get(controlName);
    return !!(
      control?.hasError(errorName) &&
      (control.dirty || control.touched)
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
