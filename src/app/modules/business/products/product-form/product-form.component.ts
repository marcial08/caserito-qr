import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Components
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ImageUploadComponent } from '../../image-upload/image-upload.component';

// Services
import { BusinessService } from '../../../../core/services/business.service';
import { ProductService } from '../../../../core/services/product.service';

// Models
import {
  Category,
  Product,
  ProductImage,
} from '../../../../core/models/menu.model';
import { CategoryService } from '../../../../core/services/category.service';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    ImageUploadComponent,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  productId?: number;
  product?: Product;
  planLimits: any = null;

  // Image management
  uploadedImages: ProductImage[] = [];
  primaryImageIndex = 0;
  uploadingImages = false;

  private businessId = '8d3b46cb-afb7-49f8-bfea-2d64bef2d4eb';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private businessService: BusinessService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private uploadService: UploadService,
    private toastr: ToastrService,
  ) {
    this.productForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.loadCategories();
    this.loadPlanLimits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkEditMode(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id']; // Convertir a number
        this.loadProduct(this.productId);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      category_id: ['', Validators.required],
      business_id: ['business-123', Validators.required], // Obtener del servicio de auth

      // Pricing
      base_price: [0, [Validators.required, Validators.min(0)]],
      compare_price: [null, [Validators.min(0)]],
      cost_price: [null, [Validators.min(0)]],
      currency: ['EUR', Validators.required],

      // Inventory & SKU
      sku: ['', Validators.maxLength(50)],
      is_available: [true],

      // Sorting
      sort_order: [0, [Validators.min(0)]],

      // Tags (será un array de strings)
      tags: [[]],
    });
  }

  // Form Getters
  get tagsArray(): string[] {
    const tagsControl = this.productForm.get('tags');
    return tagsControl?.value || [];
  }

  // Image Management
  onImagesUploaded(images: File[]): void {
    if (images.length === 0) return;

    // Verificar límite de plan
    if (
      this.planLimits?.numeric?.max_images &&
      this.uploadedImages.length + images.length >
        this.planLimits.numeric.max_images
    ) {
      this.toastr.warning(
        `Has alcanzado el límite de ${this.planLimits.numeric.max_images} imágenes permitidas por tu plan`,
      );
      return;
    }

    this.uploadingImages = true;

    // En modo edición y con producto ya creado
    if (this.isEditMode && this.productId) {
      this.uploadImagesToServer(images);
    } else {
      // En modo creación, preparar para enviar con el producto
      this.prepareImagesForProduct(images);
    }
  }

  private uploadImagesToServer(images: File[]): void {
    this.uploadService
      .uploadProductImages('product', this.businessId, this.productId!, images)
      .subscribe({
        next: (response: any) => {
          // Asumimos que response contiene las imágenes subidas con sus IDs
          if (response.data && Array.isArray(response.data)) {
            response.data.forEach((uploadedImage: any) => {
              const newImage: ProductImage = {
                id: uploadedImage.id,
                product_id: this.productId!,
                url: uploadedImage.url || uploadedImage.path,
                alt_text:
                  uploadedImage.alt_text ||
                  this.productForm.get('name')?.value ||
                  'Product image',
                sort_order: this.uploadedImages.length,
                is_primary: this.uploadedImages.length === 0,
              };
              this.uploadedImages.push(newImage);
            });
          }

          this.uploadingImages = false;
          this.toastr.success(
            `${images.length} imagen(es) subida(s) correctamente`,
          );
        },
        error: (error) => {
          console.error('Error subiendo imágenes:', error);
          this.toastr.error(
            'Error al subir imágenes: ' +
              (error.error?.message || error.message),
          );
          this.uploadingImages = false;
        },
      });
  }

  // **NUEVO: Método para preparar imágenes en modo creación**
  private prepareImagesForProduct(images: File[]): void {
    const imagePromises = images.map((file, index) => {
      return new Promise<ProductImage>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const newImage: ProductImage = {
            id: 0, // ID temporal para identificarlas
            product_id: 0,
            url: e.target.result, // Esto es una data URL temporal
            file: file, // Guardamos el archivo para enviarlo después
            alt_text: this.productForm.get('name')?.value || 'Product image',
            sort_order: this.uploadedImages.length + index,
            is_primary: this.uploadedImages.length === 0 && index === 0,
          };
          resolve(newImage);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newImages) => {
      this.uploadedImages.push(...newImages);
      this.uploadingImages = false;
      this.toastr.success(
        `${images.length} imagen(es) cargada(s) correctamente`,
      );
    });
  }

  removeImage(index: number): void {
    const imageToRemove = this.uploadedImages[index];

    if (this.isEditMode && imageToRemove.id !== 0) {
      // En modo edición, eliminar del servidor
      if (!confirm('¿Estás seguro de eliminar esta imagen?')) {
        return;
      }

      this.uploadService.deleteImage(imageToRemove.id).subscribe({
        next: () => {
          this.uploadedImages.splice(index, 1);
          this.updateImageOrder();
          this.toastr.success('Imagen eliminada correctamente');
        },
        error: (error: any) => {
          // Corregido: removí el ": any" extra
          console.error('Error eliminando imagen:', error);
          this.toastr.error('Error al eliminar la imagen');
        },
      });
    } else {
      // En modo creación o imagen temporal
      this.uploadedImages.splice(index, 1);
      this.updateImageOrder();
    }
  }

  // **ACTUALIZA el método setPrimaryImage:**
  setPrimaryImage(index: number): void {
    const image = this.uploadedImages[index];
    console.log('Estableciendo imagen principal:', image);

    if (this.isEditMode && image.id !== 0) {
      // En modo edición, actualizar en servidor
      this.uploadService.setPrimaryImage('product', image.entity_id!, image.id).subscribe({
        next: () => {
          this.updatePrimaryImage(index);
        },
        error: (error) => {
          console.error('Error estableciendo imagen principal:', error);
          this.toastr.error('Error al establecer imagen principal');
        },
      });
    } else {
      // En modo creación
      this.updatePrimaryImage(index);
    }
  }

  private updatePrimaryImage(index: number): void {
    this.uploadedImages.forEach((img, i) => {
      img.is_primary = i === index;
    });
    this.primaryImageIndex = index;
  }

  // **NUEVO: Método para actualizar orden de imágenes**
  private updateImageOrder(): void {
    this.uploadedImages.forEach((img, i) => {
      img.sort_order = i;
      if (i === 0 && !this.uploadedImages.some((img) => img.is_primary)) {
        img.is_primary = true;
        this.primaryImageIndex = 0;
      }
    });
  }

  private createProduct(productData: any): void {
    this.isSubmitting = true;

    // Crear el producto
    this.productService.createProduct(productData).subscribe({
      next: (createdProduct) => {
        this.productId = createdProduct.id;

        // Si hay imágenes, subirlas ahora
        if (this.uploadedImages.length > 0) {
          const files = this.uploadedImages
            .filter((img) => img.file)
            .map((img) => img.file as File);

          if (files.length > 0) {
            this.uploadImagesAfterCreation(files, createdProduct.id);
          } else {
            this.handleSuccess(createdProduct);
          }
        } else {
          this.handleSuccess(createdProduct);
        }
      },
      error: (error: any) => {
        console.error('Error creating product:', error);
        this.toastr.error(
          'Error al crear el producto: ' +
            (error.error?.message || error.message),
        );
        this.isSubmitting = false;
      },
    });
  }

  // **NUEVO: Método para subir imágenes después de crear el producto**
  private uploadImagesAfterCreation(files: File[], productId: number): void {
    this.uploadService
      .uploadProductImages('product', this.businessId, productId, files)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.handleSuccess({ id: productId });
        },
        error: (error: any) => {
          console.error('Error uploading images after creation:', error);
          // El producto se creó pero las imágenes no
          this.toastr.warning(
            'Producto creado, pero hubo problemas subiendo algunas imágenes',
          );
          this.router.navigate(['/business/products']);
        },
      });
  }

  // Tags Management
  addTag(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tag = input.value.trim();

    if (tag && !this.tagsArray.includes(tag)) {
      const updatedTags = [...this.tagsArray, tag];
      this.productForm.get('tags')?.setValue(updatedTags);
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const updatedTags = this.tagsArray.filter((t) => t !== tag);
    this.productForm.get('tags')?.setValue(updatedTags);
  }

  // Data Loading
  private loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.patchFormWithProduct(product);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading product:', error);
        this.toastr.error('Producto no encontrado');
        this.router.navigate(['/business/products']);
        this.isLoading = false;
      },
    });
  }

  private patchFormWithProduct(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      business_id: product.business_id,
      base_price: product.base_price,
      compare_price: product.compare_price || null,
      cost_price: product.cost_price || null,
      currency: product.currency || 'EUR',
      sku: product.sku || '',
      is_available: product.is_available,
      sort_order: product.sort_order || 0,
      tags: product.tags || [],
    });

    // Load images
    if (product.images && product.images.length > 0) {
      this.uploadedImages = [...product.images];
      const primaryIndex = product.images.findIndex((img) => img.is_primary);
      this.primaryImageIndex = primaryIndex >= 0 ? primaryIndex : 0;
    }
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter((cat) => cat.is_active);
        // Sort by display_order
        this.categories.sort((a, b) => a.display_order - b.display_order);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar las categorías');
      },
    });
  }

  private loadPlanLimits(): void {
    this.businessService.getPlanLimits().subscribe((limits) => {
      this.planLimits = limits;
    });
  }

  // Form Submission
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.toastr.error('Por favor, completa los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    // Preparar datos del producto (sin imágenes, se suben por separado)
    const productData: any = {
      ...formValue,
      base_price: this.convertToNumber(formValue.base_price),
      compare_price: this.convertToNumber(formValue.compare_price),
      cost_price: this.convertToNumber(formValue.cost_price),
      sort_order: this.convertToNumber(formValue.sort_order || 0),
      tags: this.tagsArray,
      // Nota: Las imágenes se manejan por separado
    };

    if (this.isEditMode && this.productId) {
      this.updateProduct(productData);
    } else {
      this.createProduct(productData);
    }
  }

  private updateProduct(productData: any): void {
    if (!this.productId) return;

    this.productService
      .updateProduct(this.productId, productData)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (updatedProduct) => {
          this.toastr.success('Producto actualizado correctamente');
          this.router.navigate(['/business/products']);
        },
        error: (error: any) => {
          console.error('Error updating product:', error);
          this.toastr.error(
            'Error al actualizar el producto: ' + error.message,
          );
        },
      });
  }

  onCancel(): void {
    this.location.back();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  // Helper method for error display
  hasError(controlName: string, errorName: string): boolean {
    const control = this.productForm.get(controlName);
    return control
      ? control.hasError(errorName) && (control.dirty || control.touched)
      : false;
  }

  // Price calculation helpers
  calculateProfitMargin(): number {
    const basePrice = this.productForm.get('base_price')?.value || 0;
    const costPrice = this.productForm.get('cost_price')?.value || 0;

    if (costPrice === 0) return 0;

    const profit = basePrice - costPrice;
    return (profit / costPrice) * 100;
  }

  calculateDiscountPercentage(): number {
    const basePrice = this.productForm.get('base_price')?.value || 0;
    const comparePrice = this.productForm.get('compare_price')?.value || 0;

    if (comparePrice === 0 || comparePrice <= basePrice) return 0;

    return ((comparePrice - basePrice) / comparePrice) * 100;
  }

  // Auto-generate SKU
  generateSKU(): void {
    const productName = this.productForm.get('name')?.value || '';
    const categoryId = this.productForm.get('category_id')?.value || '';

    if (productName && categoryId) {
      const category = this.categories.find((c) => c.id === categoryId);
      const categoryCode =
        category?.name.substring(0, 3).toUpperCase() || 'PRO';
      const productCode = productName
        .substring(0, 3)
        .toUpperCase()
        .replace(/\s/g, '');
      const randomNum = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');

      const generatedSKU = `${categoryCode}-${productCode}-${randomNum}`;
      this.productForm.get('sku')?.setValue(generatedSKU);
      this.toastr.info('SKU generado automáticamente');
    } else {
      this.toastr.warning(
        'Primero ingresa el nombre y selecciona una categoría',
      );
    }
  }

  private handleSuccess(product: any): void {
    this.toastr.success('Producto creado correctamente');
    this.router.navigate(['/business/products']);
    this.isSubmitting = false;
  }
  private convertToNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Si ya es número, retornarlo
    if (typeof value === 'number') {
      return value;
    }

    // Si es string, convertir a número
    if (typeof value === 'string') {
      // Remover comas y espacios
      const cleaned = value.replace(/,/g, '').trim();

      // Convertir a número con decimales
      const num = parseFloat(cleaned);

      // Verificar si es un número válido
      if (!isNaN(num) && isFinite(num)) {
        // Redondear a 2 decimales para montos monetarios
        if (cleaned.includes('.')) {
          return parseFloat(num.toFixed(2));
        }
        return num;
      }
    }

    // Si no se puede convertir, retornar null
    return null;
  }
}
