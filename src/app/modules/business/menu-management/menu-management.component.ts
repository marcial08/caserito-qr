import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { Category, Product } from '../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  menuStructure: any[] = [];
  isLoading = false;
  isDragging = false;
  activeTab: 'structure' | 'preview' | 'settings' = 'structure';

  // New category
  newCategoryName = '';
  newCategoryDescription = '';

  // Search
  searchTerm: string = '';

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMenuData();
  }

  loadMenuData(): void {
    this.isLoading = true;

    // Load categories
    this.businessService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(cat => cat.is_active);
        this.categories.sort((a, b) => a.display_order - b.display_order);
        
        // Load products
        this.businessService.getProducts().subscribe({
          next: (products) => {
            this.products = products;
            this.buildMenuStructure();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading products:', error);
            this.toastr.error('Error al cargar los productos');
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar las categorías');
        this.isLoading = false;
      }
    });
  }

  buildMenuStructure(): void {
    this.menuStructure = this.categories.map(category => {
      const categoryProducts = this.products
        .filter(product => product.category_id === category.id && product.is_available)
        .sort((a, b) => a.sort_order - b.sort_order);
      
      return {
        ...category,
        products: categoryProducts,
        isExpanded: true
      };
    });
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) {
      this.toastr.warning('El nombre de la categoría es requerido');
      return;
    }

    const newCategory: any = {
      business_id: 'business-123', // Esto vendría del servicio
      name: this.newCategoryName,
      description: this.newCategoryDescription || undefined,
      display_order: this.categories.length + 1,
      is_active: true
    };

    this.businessService.createCategory(newCategory).subscribe({
      next: (category) => {
        this.categories.push(category);
        this.buildMenuStructure();
        this.newCategoryName = '';
        this.newCategoryDescription = '';
        this.toastr.success('Categoría creada correctamente');
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.toastr.error('Error al crear la categoría');
      }
    });
  }

  toggleCategoryExpand(category: any): void {
    category.isExpanded = !category.isExpanded;
  }

  deleteCategory(categoryId: string): void {
    if (confirm('¿Estás seguro de eliminar esta categoría? Los productos se moverán a "Sin categoría".')) {
      // In a real app, call businessService.deleteCategory(categoryId)
      this.categories = this.categories.filter(c => c.id !== categoryId);
      this.buildMenuStructure();
      this.toastr.success('Categoría eliminada');
    }
  }

  deleteProduct(productId: string): void {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      // In a real app, call businessService.deleteProduct(productId)
      this.products = this.products.filter(p => p.id !== productId);
      this.buildMenuStructure();
      this.toastr.success('Producto eliminado');
    }
  }

  toggleProductAvailability(product: Product): void {
    product.is_available = !product.is_available;
    // In a real app, call businessService.updateProduct(product.id, { is_available: product.is_available })
    this.toastr.success(`Producto ${product.is_available ? 'activado' : 'desactivado'}`);
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

  getProductCount(categoryId: string): number {
    return this.products.filter(p => p.category_id === categoryId && p.is_available).length;
  }

  getTotalProducts(): number {
    return this.products.filter(p => p.is_available).length;
  }

  getTotalCategories(): number {
    return this.categories.length;
  }
}