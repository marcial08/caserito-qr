import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { Category, Product } from '../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../../../core/services/category.service';
import { UploadService } from '../../../core/services/upload.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss'],
})
export class MenuManagementComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  menuStructure: any[] = [];
  isLoading = false;
  isDragging = false;
  activeTab: 'structure' | 'preview' | 'settings' = 'structure';
  previewDevice: 'mobile' | 'tablet' | 'desktop' = 'mobile';

  // New category
  newCategoryName = '';
  newCategoryDescription = '';

  selectedFiles: File[] = [];
  isUploading = false;
  private businessId = '8d3b46cb-afb7-49f8-bfea-2d64bef2d4eb';

  // Mock de Configuraciones (Esto simulará tu base de datos)
  menuSettings = {
    display: {
      showPrices: true,
      showImages: true,
      showDescriptions: true,
    },
    behavior: {
      showUnavailable: false,
      autoExpand: false,
      showProductCount: true,
    },
    layout: 'grid' as 'grid' | 'list' | 'card',
  };

  // Search
  searchTerm: string = '';

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private uploadService: UploadService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMenuData();
  }

  setPreviewDevice(device: 'mobile' | 'tablet' | 'desktop'): void {
    this.previewDevice = device;
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = [files[0]]; // Para categorías solemos usar solo una
    }
  }

  saveSettings(): void {
    this.isLoading = true;
    // Simulamos una llamada a la API
    setTimeout(() => {
      this.isLoading = false;
      this.toastr.success('Configuración guardada correctamente (Mock)');
      this.buildMenuStructure(); // Reconstruimos para aplicar cambios visuales
    }, 800);
  }

  resetSettings(): void {
    this.menuSettings = {
      display: { showPrices: true, showImages: true, showDescriptions: true },
      behavior: {
        showUnavailable: false,
        autoExpand: false,
        showProductCount: true,
      },
      layout: 'grid',
    };
    this.toastr.info('Valores restaurados');
  }

  // Helper para clases CSS dinámicas en el Preview
  getPreviewClasses() {
    return {
      [`preview-device-${this.previewDevice}`]: true,
      [`layout-${this.menuSettings.layout}`]: true,
      'hide-prices': !this.menuSettings.display.showPrices,
      'hide-images': !this.menuSettings.display.showImages,
      'hide-descriptions': !this.menuSettings.display.showDescriptions,
    };
  }

  loadMenuData(): void {
    this.isLoading = true;

    // Load categories
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter((cat) => cat.is_active);
        this.categories.sort((a, b) => a.display_order - b.display_order);
        console.log('Categorías cargadas:', this.categories);
        // Load products
        this.productService.getProducts().subscribe({
          next: (products) => {
            console.log('Productos cargados:', products);
            this.products = products;
            this.buildMenuStructure();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading products:', error);
            this.toastr.error('Error al cargar los productos');
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar las categorías');
        this.isLoading = false;
      },
    });
  }

  buildMenuStructure(): void {
    this.menuStructure = this.categories.map((category) => {
      const categoryProducts = this.products
        .filter(
          (product) =>
            product.category_id === category.id && product.is_available,
        )
        .sort((a, b) => a.sort_order - b.sort_order);

      return {
        ...category,
        products: categoryProducts,
        isExpanded: true,
      };
    });
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) {
      this.toastr.warning('El nombre de la categoría es requerido');
      return;
    }

    this.isLoading = true;

    const newCategory: Partial<Category> = {
      business_id: this.businessId, // ID de ejemplo de tu respuesta
      name: this.newCategoryName,
      description: this.newCategoryDescription || '',
      display_order: this.categories.length + 1,
      is_active: true,
    };

    this.categoryService.createCategory(newCategory as Category).subscribe({
      next: (response: any) => {
        console.log('Respuesta de creación de categoría:', response);
        // Validamos que la respuesta sea exitosa según tu JSON
        if (response.id) {
          console.log('Categoría creada con ID:', response.id);
          const categoryCreated = response;

          // Manejo de la imagen si seleccionaste una
          if (this.selectedFiles && this.selectedFiles.length > 0) {
            this.uploadService
              .uploadProductImages(
                'category',
                this.businessId,
                categoryCreated.id,
                this.selectedFiles,
              )
              .subscribe({
                next: (uploadRes: any) => {
                  // Si la subida es exitosa, actualizamos la URL de la imagen en el objeto local
                  if (uploadRes.success && uploadRes.data.length > 0) {
                    categoryCreated.cover_image_url = uploadRes.data[0].url;
                  }
                  this.finalizeCreation(categoryCreated);
                },
                error: (err) => {
                  this.toastr.error(
                    'Categoría creada, pero falló la subida de imagen',
                  );
                  this.finalizeCreation(categoryCreated);
                },
              });
          } else {
            this.finalizeCreation(categoryCreated);
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al crear:', error);
        this.toastr.error('No se pudo crear la categoría');
      },
    });
  }

  private finalizeCreation(category: Category): void {
    console.log('Categoría creada:', category);
    // 1. Agregamos a la lista plana
    this.categories.push(category);

    // 2. Reconstruimos la estructura del menú (para que aparezca en el acordeón)
    this.buildMenuStructure();

    // 3. Limpiamos
    this.resetForm();
    this.isLoading = false;
    this.toastr.success('Categoría creada correctamente');
  }
  toggleCategoryExpand(category: any): void {
    category.isExpanded = !category.isExpanded;
  }

  deleteCategory(categoryId: number): void {
    if (
      confirm(
        '¿Estás seguro de eliminar esta categoría? Los productos se moverán a "Sin categoría".',
      )
    ) {
      // In a real app, call businessService.deleteCategory(categoryId)
      this.categories = this.categories.filter((c) => c.id !== categoryId);
      this.buildMenuStructure();
      this.toastr.success('Categoría eliminada');
    }
  }

  deleteProduct(productId: number): void {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      // In a real app, call businessService.deleteProduct(productId)
      this.products = this.products.filter((p) => p.id !== productId);
      this.buildMenuStructure();
      this.toastr.success('Producto eliminado');
    }
  }

  toggleProductAvailability(product: Product): void {
    product.is_available = !product.is_available;
    // In a real app, call businessService.updateProduct(product.id, { is_available: product.is_available })
    this.toastr.success(
      `Producto ${product.is_available ? 'activado' : 'desactivado'}`,
    );
  }

  moveCategoryUp(index: number): void {
    if (index > 0) {
      const temp = this.menuStructure[index];
      this.menuStructure[index] = this.menuStructure[index - 1];
      this.menuStructure[index - 1] = temp;

      // Update display_order in database
      this.updateCategoryOrder();
    }
  }

  moveCategoryDown(index: number): void {
    if (index < this.menuStructure.length - 1) {
      const temp = this.menuStructure[index];
      this.menuStructure[index] = this.menuStructure[index + 1];
      this.menuStructure[index + 1] = temp;

      // Update display_order in database
      this.updateCategoryOrder();
    }
  }

  updateCategoryOrder(): void {
    this.menuStructure.forEach((category, index) => {
      category.display_order = index + 1;
      // In a real app, call businessService.updateCategory(category.id, { display_order: category.display_order })
    });
    this.toastr.info('Orden de categorías actualizado');
  }

  moveProductUp(categoryIndex: number, productIndex: number): void {
    const category = this.menuStructure[categoryIndex];
    if (productIndex > 0) {
      const temp = category.products[productIndex];
      category.products[productIndex] = category.products[productIndex - 1];
      category.products[productIndex - 1] = temp;

      // Update sort_order in database
      this.updateProductOrder(category);
    }
  }

  moveProductDown(categoryIndex: number, productIndex: number): void {
    const category = this.menuStructure[categoryIndex];
    if (productIndex < category.products.length - 1) {
      const temp = category.products[productIndex];
      category.products[productIndex] = category.products[productIndex + 1];
      category.products[productIndex + 1] = temp;

      // Update sort_order in database
      this.updateProductOrder(category);
    }
  }

  updateProductOrder(category: any): void {
    category.products.forEach((product: Product, index: number) => {
      product.sort_order = index + 1;
      // In a real app, call businessService.updateProduct(product.id, { sort_order: product.sort_order })
    });
    this.toastr.info('Orden de productos actualizado');
  }

  setActiveTab(tab: 'structure' | 'preview' | 'settings'): void {
    this.activeTab = tab;
  }

  getProductCount(categoryId: number): number {
    return this.products.filter(
      (p) => p.category_id === categoryId && p.is_available,
    ).length;
  }

  getTotalProducts(): number {
    return this.products.filter((p) => p.is_available).length;
  }

  getTotalCategories(): number {
    return this.categories.length;
  }

  // Método auxiliar para limpiar el formulario
  private resetForm(): void {
    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.selectedFiles = [];
    // Resetear el input file nativo si es necesario
    const fileInput = document.getElementById(
      'categoryImage',
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // En tu archivo .ts
  isAddCategoryExpanded: boolean = false;

  toggleAddCategory(): void {
    this.isAddCategoryExpanded = !this.isAddCategoryExpanded;
  }

  getPrimaryImage(images: any[]): string {
    if (!images || images.length === 0) return '';
    const primary = images.find((img) => img.is_primary);
    return primary ? primary.url : images[0].url;
  }
}
