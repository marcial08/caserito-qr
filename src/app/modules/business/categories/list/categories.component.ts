import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../../core/services/business.service';
import { Category } from '../../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  planLimits: any = null;
  isLoading = false;

  // Search
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  constructor(
    private categoryService: CategoryService,
    private businessService: BusinessService,
    private toastr: ToastrService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
      this.filteredCategories = [...this.categories];
      this.updatePagination();
      this.isLoading = false;
    });

    this.businessService.getPlanLimits().subscribe((limits) => {
      this.planLimits = limits;
    });
  }

  filterCategories(): void {
    if (!this.searchTerm) {
      this.filteredCategories = [...this.categories];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower),
      );
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  deleteCategory(category: Category): void {
    if (category.product_count && category.product_count > 0) {
      if (
        !confirm(
          `"${category.name}" tiene ${category.product_count} producto(s). ¿Deseas moverlos a "Sin categoría" antes de eliminar?`,
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`¿Estás seguro de eliminar "${category.name}"?`)) {
        return;
      }
    }

    this.isLoading = true;
    this.categoryService.deleteCategory(Number(category.id)).subscribe({
      next: (response) => {
        this.toastr.success(
          `Categoría "${category.name}" eliminada`,
          'Éxito',
        );
        // Actualizar lista localmente
        this.categories = this.categories.filter((c) => c.id !== category.id);
        this.filterCategories();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al eliminar categoría:', error);
        let errorMessage = 'No se pudo eliminar la categoría';

        if (error.message.includes('productos activos')) {
          errorMessage =
            'No se puede eliminar una categoría con productos activos';
        } else if (error.message.includes('no encontrada')) {
          errorMessage = 'La categoría no existe';
        }

        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
      },
    });
  }

  toggleCategoryStatus(category: Category): void {
    const newStatus = !category.is_active;
    const action = newStatus ? 'activar' : 'desactivar';

    if (
      !confirm(`¿Estás seguro de ${action} la categoría "${category.name}"?`)
    ) {
      return;
    }

    this.categoryService
      .updateCategory(Number(category.id), { is_active: newStatus })
      .subscribe({
        next: (updatedCategory) => {
          // Actualizar la categoría en la lista local
          const index = this.categories.findIndex((c) => c.id === category.id);
          if (index !== -1) {
            this.categories[index] = updatedCategory;
          }

          this.toastr.success(
            `Categoría ${newStatus ? 'activada' : 'desactivada'}`,
            'Éxito',
          );
          this.filterCategories();
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.toastr.error(
            'No se pudo cambiar el estado de la categoría',
            'Error',
          );
        },
      });
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.pageSize);
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

  get paginatedCategories(): Category[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCategories.slice(start, end);
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
