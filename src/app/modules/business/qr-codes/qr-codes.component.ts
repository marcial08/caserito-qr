import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { QRCode } from '../../../core/models/qr.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-qr-codes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './qr-codes.component.html',
  styleUrls: ['./qr-codes.component.scss']
})
export class QrCodesComponent implements OnInit {
  qrCodes: QRCode[] = [];
  filteredQRCodes: QRCode[] = [];
  planLimits: any = null;
  isLoading = false;

  // Search
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 12;
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

    this.businessService.getQRCodes().subscribe((qrCodes) => {
      this.qrCodes = qrCodes;
      this.filteredQRCodes = [...qrCodes];
      this.updatePagination();
      this.isLoading = false;
    });

    this.businessService.getPlanLimits().subscribe((limits) => {
      this.planLimits = limits;
    });
  }

  filterQRCodes(): void {
    if (!this.searchTerm) {
      this.filteredQRCodes = [...this.qrCodes];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredQRCodes = this.qrCodes.filter(qr =>
        qr.name.toLowerCase().includes(searchLower) ||
        qr.slug.toLowerCase().includes(searchLower)
      );
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  getLastScannedText(qr: QRCode): string {
    if (!qr.last_scanned) return 'Nunca escaneado';
    
    const lastScanned = new Date(qr.last_scanned);
    const now = new Date();
    const diffMs = now.getTime() - lastScanned.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  downloadQR(qr: QRCode): void {
    // In a real app, generate and download QR code image
    this.toastr.info('Función de descarga de QR en desarrollo', 'Información');
  }

  copyURL(qr: QRCode): void {
    if (!qr.url) {
      this.toastr.warning('Este QR no tiene URL configurada', 'Advertencia');
      return;
    }
    
    navigator.clipboard.writeText(qr.url).then(() => {
      this.toastr.success('URL copiada al portapapeles', 'Éxito');
    }).catch(err => {
      console.error('Error al copiar URL:', err);
      this.toastr.error('Error al copiar URL', 'Error');
    });
  }

  deleteQR(qr: QRCode): void {
    if (confirm(`¿Estás seguro de eliminar el QR "${qr.name}"? Esta acción no se puede deshacer.`)) {
      this.toastr.success(`QR "${qr.name}" eliminado`, 'Éxito');
      this.qrCodes = this.qrCodes.filter(q => q.id !== qr.id);
      this.filterQRCodes();
    }
  }

  // Helper method to ensure URL exists
  getQRUrl(qr: QRCode): string {
    return qr.url || `https://menugr.pro/m/${qr.slug}`;
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredQRCodes.length / this.pageSize);
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

  get paginatedQRCodes(): QRCode[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredQRCodes.slice(start, end);
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