import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Services


// Models

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ImageUploadComponent } from '../../image-upload/image-upload.component';
import { BusinessService } from '../../../../core/services/business.service';
import { Category, Product, ProductImage } from '../../../../core/models/menu.model';

// Components

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    ImageUploadComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  productId?: string;
  product?: Product;
  planLimits: any = null;

  // Image management
  uploadedImages: ProductImage[] = [];
  primaryImageIndex = 0;

  // Variants
  showVariantsSection = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private businessService: BusinessService,
    private toastr: ToastrService
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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = params['id'];
        // this.loadProduct(this.productId);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      category_id: ['', Validators.required],
      
      // Pricing
      base_price: [0, [Validators.required, Validators.min(0)]],
      compare_price: [0, [Validators.min(0)]],
      cost_price: [0, [Validators.min(0)]],
      currency: ['EUR', Validators.required],
      
      // Inventory & SKU
      sku: [''],
      is_available: [true],
      
      // Sorting
      sort_order: [0, [Validators.min(0)]],
      
      // Tags
      tags: [[]]
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

    this.isLoading = true;
    
    // Simulate upload process
    images.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newImage: ProductImage = {
          id: `img-temp-${Date.now()}-${index}`,
          product_id: this.productId || 'temp',
          url: e.target.result,
          alt_text: this.productForm.get('name')?.value || 'Product image',
          sort_order: this.uploadedImages.length,
          is_primary: this.uploadedImages.length === 0
        };
        
        this.uploadedImages.push(newImage);
        
        if (index === images.length - 1) {
          this.isLoading = false;
          this.toastr.success(`${images.length} imagen(es) cargada(s) correctamente`);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
    // Reassign sort_order and primary image
    this.uploadedImages.forEach((img, i) => {
      img.sort_order = i;
      if (index === this.primaryImageIndex && i === 0) {
        img.is_primary = true;
        this.primaryImageIndex = 0;
      }
    });
  }

  setPrimaryImage(index: number): void {
    this.uploadedImages.forEach((img, i) => {
      img.is_primary = i === index;
    });
    this.primaryImageIndex = index;
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
    const updatedTags = this.tagsArray.filter(t => t !== tag);
    this.productForm.get('tags')?.setValue(updatedTags);
  }

  // Data Loading
  private loadProduct(id: string): void {
    this.isLoading = true;
    // Since we have mock data, let's simulate loading a product
    this.businessService.getProducts().subscribe({
      next: (products) => {
        const foundProduct = products.find(p => p.id === id);
        if (foundProduct) {
          this.product = foundProduct;
          this.patchFormWithProduct(foundProduct);
        } else {
          this.toastr.error('Producto no encontrado');
          this.router.navigate(['/business/products']);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading product:', error);
        this.toastr.error('Error al cargar el producto');
        this.router.navigate(['/business/products']);
        this.isLoading = false;
      }
    });
  }

  private patchFormWithProduct(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      base_price: product.base_price,
      compare_price: product.compare_price || 0,
      cost_price: product.cost_price || 0,
      currency: product.currency || 'EUR',
      sku: product.sku || '',
      is_available: product.is_available,
      sort_order: product.sort_order || 0,
      tags: product.tags || []
    });

    // Load images
    if (product.images && product.images.length > 0) {
      this.uploadedImages = [...product.images];
      const primaryIndex = product.images.findIndex(img => img.is_primary);
      this.primaryImageIndex = primaryIndex >= 0 ? primaryIndex : 0;
    }
  }

  private loadCategories(): void {
    this.businessService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(cat => cat.is_active);
        // Sort by display_order
        this.categories.sort((a, b) => a.display_order - b.display_order);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar las categorías');
      }
    });
  }

  private loadPlanLimits(): void {
    this.businessService.getPlanLimits().subscribe(limits => {
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

    // Prepare product data
    const productData: any = {
      ...formValue,
      images: this.uploadedImages,
      tags: this.tagsArray,
      // Add variants if needed (you can uncomment when ready)
      // variants: this.showVariantsSection ? this.variants.value : []
    };

    if (this.isEditMode && this.productId) {
      // Since we're using mock data, simulate update
      this.simulateUpdateProduct(productData);
    } else {
      // Create new product
      this.businessService.createProduct(productData).subscribe({
        next: (createdProduct) => {
          this.toastr.success('Producto creado correctamente');
          this.router.navigate(['/business/products']);
        },
        error: (error: any) => {
          console.error('Error creating product:', error);
          this.toastr.error('Error al crear el producto');
          this.isSubmitting = false;
        }
      });
    }
  }

  private simulateUpdateProduct(productData: any): void {
    // Simulate API delay
    setTimeout(() => {
      if (this.productId) {
        // In a real app, you would call this.businessService.updateProduct()
        this.toastr.success('Producto actualizado correctamente');
        this.router.navigate(['/business/products']);
      }
    }, 1000);
  }

  onCancel(): void {
    this.location.back();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
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
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
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
      const category = this.categories.find(c => c.id === categoryId);
      const categoryCode = category?.name.substring(0, 3).toUpperCase() || 'PRO';
      const productCode = productName.substring(0, 3).toUpperCase().replace(/\s/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      const generatedSKU = `${categoryCode}-${productCode}-${randomNum}`;
      this.productForm.get('sku')?.setValue(generatedSKU);
      this.toastr.info('SKU generado automáticamente');
    } else {
      this.toastr.warning('Primero ingresa el nombre y selecciona una categoría');
    }
  }
}