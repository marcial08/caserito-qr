import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  products: string[]; // Product IDs
  min_order_amount?: number;
  max_uses?: number;
  current_uses: number;
  created_at: Date;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss']
})
export class PromotionsComponent implements OnInit {
  promotions: Promotion[] = [];
  filteredPromotions: Promotion[] = [];
  isLoading = false;

  // Filters
  selectedStatus: string = '';
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
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading = true;

    // Mock data - In a real app, call businessService.getPromotions()
    setTimeout(() => {
      this.promotions = [
        {
          id: 'promo-1',
          name: 'Descuento de Verano',
          description: '20% de descuento en todos los productos',
          discount_type: 'percentage',
          discount_value: 20,
          start_date: new Date('2024-07-01'),
          end_date: new Date('2024-09-30'),
          is_active: true,
          products: ['prod-1', 'prod-2'],
          current_uses: 45,
          created_at: new Date()
        },
        {
          id: 'promo-2',
          name: 'Envío Gratis',
          description: 'Envío gratis en pedidos superiores a €25',
          discount_type: 'fixed',
          discount_value: 5,
          start_date: new Date('2024-06-01'),
          end_date: new Date('2024-12-31'),
          is_active: true,
          products: ['prod-1', 'prod-2'],
          min_order_amount: 25,
          current_uses: 120,
          created_at: new Date()
        }
      ];

      this.filteredPromotions = [...this.promotions];
      this.updatePagination();
      this.isLoading = false;
    }, 800);
  }

  filterPromotions(): void {
    this.filteredPromotions = this.promotions.filter(promo => {
      // Filter by status
      if (this.selectedStatus) {
        if (this.selectedStatus === 'active' && !promo.is_active) return false;
        if (this.selectedStatus === 'expired' && new Date(promo.end_date) > new Date()) return false;
        if (this.selectedStatus === 'upcoming' && new Date(promo.start_date) > new Date()) return false;
      }

      // Filter by search term
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return promo.name.toLowerCase().includes(searchLower) ||
               promo.description?.toLowerCase().includes(searchLower);
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  getPromotionStatus(promo: Promotion): string {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);

    if (!promo.is_active) return 'Inactiva';
    if (now < start) return 'Próxima';
    if (now > end) return 'Expirada';
    return 'Activa';
  }

  getPromotionStatusClass(promo: Promotion): string {
    const status = this.getPromotionStatus(promo);
    switch (status) {
      case 'Activa': return 'status-active';
      case 'Próxima': return 'status-upcoming';
      case 'Expirada': return 'status-expired';
      default: return 'status-inactive';
    }
  }

  getDiscountText(promo: Promotion): string {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}%`;
    } else {
      return `€${promo.discount_value}`;
    }
  }

  deletePromotion(promo: Promotion): void {
    if (confirm(`¿Estás seguro de eliminar la promoción "${promo.name}"?`)) {
      this.toastr.success(`Promoción "${promo.name}" eliminada`, 'Éxito');
      this.promotions = this.promotions.filter(p => p.id !== promo.id);
      this.filterPromotions();
    }
  }

  togglePromotionStatus(promo: Promotion): void {
    promo.is_active = !promo.is_active;
    this.toastr.success(
      `Promoción ${promo.is_active ? 'activada' : 'desactivada'}`,
      'Éxito'
    );
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPromotions.length / this.pageSize);
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

  get paginatedPromotions(): Promotion[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPromotions.slice(start, end);
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