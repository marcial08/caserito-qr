import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../../core/services/business.service';
import { Product, Category } from '../../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  planLimits: any = null;
  isLoading = false;
  deleting = false;

  // Filters
  selectedCategory: number = -1;
  selectedAvailability: string = '';
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 9;
  totalPages = 1;

  constructor(
    private businessService: BusinessService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastr: ToastrService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Usar business_id real si tienes
    const businessId = 'business-123'; // Reemplaza con el business_id real
    
   // this.productService.getProducts({ business_id: businessId }).subscribe({
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.toastr.error('No se pudieron cargar los productos', 'Error');
        this.isLoading = false;
      }
    });

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });

    this.businessService.getPlanLimits().subscribe((limits) => {
      this.planLimits = limits;
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.deleting = true;
    this.productService.deleteProduct(product.id).subscribe({
      next: (response) => {
        this.toastr.success(response.message || `Producto "${product.name}" eliminado`, 'Éxito');
        
        // Actualizar lista localmente
        this.products = this.products.filter(p => p.id !== product.id);
        this.filteredProducts = this.filteredProducts.filter(p => p.id !== product.id);
        this.updatePagination();
        
        this.deleting = false;
      },
      error: (error) => {
        console.error('Error al eliminar producto:', error);
        
        let errorMessage = 'No se pudo eliminar el producto';
        
        if (error.message.includes('no encontrado')) {
          errorMessage = 'El producto no existe';
        } else if (error.message.includes('en uso') || error.message.includes('relacionado')) {
          errorMessage = 'El producto está en uso y no se puede eliminar';
        } else if (error.message.includes('No se pudo conectar')) {
          errorMessage = 'Error de conexión con el servidor';
        }
        
        this.toastr.error(errorMessage, 'Error');
        this.deleting = false;
      }
    });
  }

  toggleProductStatus(product: Product): void {
    const newStatus = !product.is_available;
    const action = newStatus ? 'disponible' : 'no disponible';
    
    if (!confirm(`¿Estás seguro de marcar el producto como ${action}?`)) {
      return;
    }

    this.productService.updateProduct(product.id, { is_available: newStatus }).subscribe({
      next: (updatedProduct) => {
        // Actualizar el producto en ambas listas
        const updateInArray = (array: Product[]) => {
          const index = array.findIndex(p => p.id === product.id);
          if (index !== -1) {
            array[index] = updatedProduct;
          }
        };
        
        updateInArray(this.products);
        updateInArray(this.filteredProducts);
        
        this.toastr.success(
          `Producto marcado como ${newStatus ? 'disponible' : 'no disponible'}`,
          'Éxito'
        );
        this.filterProducts(); // Re-filtrar para mantener los filtros aplicados
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.toastr.error('No se pudo cambiar el estado del producto', 'Error');
      }
    });
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(product => {
      // Filter by category
      if (this.selectedCategory && product.category_id !== this.selectedCategory) {
        return false;
      }

      // Filter by availability
      if (this.selectedAvailability === 'available' && !product.is_available) {
        return false;
      }
      if (this.selectedAvailability === 'unavailable' && product.is_available) {
        return false;
      }

      // Filter by search term
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return product.name.toLowerCase().includes(searchLower) ||
               product.description?.toLowerCase().includes(searchLower) ||
               (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower)));
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    start = Math.max(1, end - maxPages + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredProducts.slice(start, end);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  // Manejar eventos de filtros
  onSearchChange(): void {
    this.filterProducts();
  }

  onCategoryChange(): void {
    this.filterProducts();
  }

  onAvailabilityChange(): void {
    this.filterProducts();
  }

  clearFilters(): void {
    this.selectedCategory = -1;
    this.selectedAvailability = '';
    this.searchTerm = '';
    this.filterProducts();
  }

  // Helper para mostrar badges de estado
  getStatusBadgeClass(product: Product): string {
    return product.is_available 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getStatusText(product: Product): string {
    return product.is_available ? 'Disponible' : 'No disponible';
  }
}