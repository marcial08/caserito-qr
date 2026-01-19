import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../../core/services/business.service';
import { Product, Category } from '../../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';

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

  // Filters
  selectedCategory: string = '';
  selectedAvailability: string = '';
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 9;
  totalPages = 1;

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.businessService.getProducts().subscribe((products) => {
      this.products = products;
      this.filteredProducts = [...products];
      this.updatePagination();
      this.isLoading = false;
    });

    this.businessService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });

    this.businessService.getPlanLimits().subscribe((limits) => {
      this.planLimits = limits;
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
               product.tags.some(tag => tag.toLowerCase().includes(searchLower));
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  deleteProduct(product: Product): void {
    if (
      confirm(
        `¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      // In a real app, call businessService.deleteProduct(product.id)
      this.toastr.success(`Producto "${product.name}" eliminado`, 'Éxito');
      this.products = this.products.filter(p => p.id !== product.id);
      this.filterProducts();
    }
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
}