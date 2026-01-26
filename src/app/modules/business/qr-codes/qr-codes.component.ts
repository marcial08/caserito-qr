import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { QRCode, PlanLimits } from '../../../core/models/qr.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { QrService } from '../../../core/services/qr.service';

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
  styleUrls: ['./qr-codes.component.scss'],
})
export class QrCodesComponent implements OnInit {
  private businessId = '8d3b46cb-afb7-49f8-bfea-2d64bef2d4eb';

  qrCodes: QRCode[] = [];
  filteredQRCodes: QRCode[] = [];
  planLimits: any = null;
  isLoading = false;

  // Search & Filters
  searchTerm: string = '';
  filterType: 'all' | 'general' | 'table' = 'all';
  imageLoadedStates: { [key: number]: boolean } = {};

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  // Estadísticas
  stats = {
    total: 0,
    general: 0,
    tables: 0,
    usagePercentage: 0,
  };

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService,
    private qrService: QrService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.qrService.getQrs({ business_id: this.businessId }).subscribe({
      next: (qrCodes) => {
        this.qrCodes = qrCodes;
        console.log('Loaded QR codes:', qrCodes);
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading QR codes:', error);
        this.toastr.error('Error al cargar los códigos QR', 'Error');
        this.isLoading = false;
      },
    });

    this.businessService.getPlanLimits().subscribe({
      next: (limits) => {
        this.planLimits = limits;
      },
      error: (error) => {
        console.error('Error loading plan limits:', error);
      },
    });
  }

  onImageLoad(qr: QRCode): void {
    this.imageLoadedStates[qr.id] = true;
  }

  onImageError(qr: QRCode): void {
    console.error(`Error loading QR image for ${qr.name}`);
    // Opcional: puedes setear qr.qr_image_url = null para mostrar el placeholder
  }

  calculateStats(): void {
    this.stats.total = this.qrCodes.length;
    this.stats.general = this.qrCodes.filter(
      (qr) => qr.type === 'general',
    ).length;
    this.stats.tables = this.qrCodes.filter((qr) => qr.type === 'table').length;

    if (this.planLimits) {
      const max =
        this.planLimits.numeric?.max_qr_codes || this.planLimits.max_qr_codes;
      this.stats.usagePercentage = Math.round((this.stats.total / max) * 100);
    }
  }

  filterQRCodes(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.qrCodes];

    // Filtrar por tipo
    if (this.filterType !== 'all') {
      filtered = filtered.filter((qr) => qr.type === this.filterType);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (qr) =>
          qr.name.toLowerCase().includes(searchLower) ||
          qr.slug.toLowerCase().includes(searchLower) ||
          (qr.location && qr.location.toLowerCase().includes(searchLower)) ||
          (qr.table_number && qr.table_number.toString().includes(searchLower)),
      );
    }

    this.filteredQRCodes = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  filterByType(type: 'all' | 'general' | 'table'): void {
    this.filterType = type;
    this.applyFilters();
  }

  getQRTypeBadge(qr: QRCode): string {
    switch (qr.type) {
      case 'general':
        return 'General';
      case 'table':
        return `Mesa ${qr.table_number || ''}`;
      default:
        return 'General';
    }
  }

  getQRTypeClass(qr: QRCode): string {
    switch (qr.type) {
      case 'general':
        return 'badge-general';
      case 'table':
        return 'badge-table';
      default:
        return 'badge-general';
    }
  }

  getLocationText(qr: QRCode): string {
    if (qr.type === 'table' && qr.location) {
      return `• ${qr.location}`;
    }
    return qr.location || '';
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

async downloadQR(qr: QRCode): Promise<void> {
    if (!qr.qr_image_url) {
        this.toastr.warning('No hay imagen QR disponible para descargar', 'Advertencia');
        return;
    }

    this.toastr.info('Convirtiendo a PNG...', 'Procesando');

    try {
        // 1. Cargar la imagen original
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Importante para CORS
        
        // Esperar a que cargue
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = qr.qr_image_url!;
        });

        // 2. Crear canvas para conversión
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('No se pudo obtener contexto 2D');
        }

        // 3. Configurar canvas al tamaño de la imagen
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 4. Dibujar la imagen en el canvas
        ctx.drawImage(img, 0, 0);
        
        // 5. Crear imagen PNG desde el canvas
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('No se pudo crear el blob PNG');
            }
            
            // 6. Crear URL para descarga
            const blobUrl = URL.createObjectURL(blob);
            
            // 7. Crear enlace de descarga
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `qr-${qr.slug || qr.name.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // 8. Limpiar
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
            
            this.toastr.success(`QR "${qr.name}" descargado como PNG`, 'Éxito');
        }, 'image/png', 1.0); // Calidad máxima
    } catch (error) {
        console.error('Error al convertir a PNG:', error);
        
        // Fallback: descargar imagen original
        this.downloadOriginal(qr);
    }
}

// Fallback: descargar imagen original
private downloadOriginal(qr: QRCode): void {
    this.toastr.info('Descargando formato original...', 'Información');
    
    const link = document.createElement('a');
    link.href = qr.qr_image_url!;
    link.download = `qr-${qr.slug || qr.name.toLowerCase().replace(/\s+/g, '-')}`;
    link.target = '_blank';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastr.success(`QR "${qr.name}" descargado`, 'Éxito');
}

  // Método de fallback
  private downloadWithFallback(qr: QRCode, fileName: string): void {
    try {
      const link = document.createElement('a');
      link.href = qr.qr_image_url!;
      link.download = fileName;
      link.target = '_blank'; // Abrir en nueva pestaña si falla la descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.toastr.success(`QR "${qr.name}" descargado`, 'Éxito');
    } catch (error) {
      console.error('Fallback también falló:', error);
      this.toastr.error('Error al descargar el QR', 'Error');
    }
  }

  copyURL(qr: QRCode): void {
    const url = this.getQRUrl(qr);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.toastr.success('URL copiada al portapapeles', 'Éxito');
      })
      .catch((err) => {
        console.error('Error al copiar URL:', err);
        this.toastr.error('Error al copiar URL', 'Error');
      });
  }

  deleteQR(qr: QRCode): void {
    if (
      confirm(
        `¿Estás seguro de eliminar el QR "${qr.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      this.qrService.deleteQr(qr.id).subscribe({
        next: (success: any) => {
          if (success) {
            this.toastr.success(`QR "${qr.name}" eliminado`, 'Éxito');
            this.qrCodes = this.qrCodes.filter((q) => q.id !== qr.id);
            this.calculateStats();
            this.applyFilters();
          }
        },
        error: (error: any) => {
          this.toastr.error('Error al eliminar el QR', 'Error');
        },
      });
    }
  }

  getQRUrl(qr: QRCode): string {
    return qr.url || `https://menugr.pro/m/${qr.slug}`;
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredQRCodes.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPages = 5;

    if (this.totalPages <= maxPages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxPages - 1);

      if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getShowingRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(
      this.currentPage * this.pageSize,
      this.filteredQRCodes.length,
    );
    return `Mostrando ${start} - ${end} de ${this.filteredQRCodes.length} códigos QR`;
  }

    async downloadQRAsPNG(qr: any): Promise<boolean> {
    if (!qr.qr_image_url) {
      this.toastr.warning('No hay imagen QR disponible', 'Advertencia');
      return false;
    }

    try {
      // 1. Cargar imagen
      const img = await this.loadImage(qr.qr_image_url);
      
      // 2. Crear canvas con dimensiones óptimas para QR
      // (Los QR funcionan mejor con dimensiones cuadradas)
      const size = Math.max(img.width, img.height, 300); // Mínimo 300px
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Contexto 2D no disponible');
      
      // 3. Configurar canvas
      canvas.width = size;
      canvas.height = size;
      
      // 4. Fondo blanco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // 5. Calcular posición centrada
      const x = (size - img.width) / 2;
      const y = (size - img.height) / 2;
      
      // 6. Dibujar imagen
      ctx.drawImage(img, x, y);
      
      // 7. Opcional: añadir texto descriptivo
      this.addQRInfo(ctx, qr, size);
      
      // 8. Convertir a PNG y descargar
      return this.downloadCanvas(canvas, qr);
      
    } catch (error) {
      console.error('Error al convertir QR a PNG:', error);
      return false;
    }
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Error al cargar imagen: ${url}`));
      img.src = url;
    });
  }

  private addQRInfo(ctx: CanvasRenderingContext2D, qr: any, canvasSize: number): void {
    // Añadir nombre del QR en la parte inferior
    const text = qr.name || `QR ${qr.id}`;
    const fontSize = Math.max(12, canvasSize / 25);
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Posicionar texto
    const textY = canvasSize - 10;
    const maxWidth = canvasSize * 0.8;
    
    // Si el texto es muy largo, ajustar
    const metrics = ctx.measureText(text);
    if (metrics.width > maxWidth) {
      ctx.font = `${fontSize * 0.8}px Arial, sans-serif`;
    }
    
    ctx.fillText(text, canvasSize / 2, textY);
  }

  private downloadCanvas(canvas: HTMLCanvasElement, qr: any): boolean {
    try {
      // Convertir a blob PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          this.toastr.error('Error al generar PNG', 'Error');
          return;
        }
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = this.generateFileName(qr, 'png');
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        this.toastr.success(`QR "${qr.name}" descargado como PNG`, 'Éxito');
      }, 'image/png', 1.0);
      
      return true;
    } catch (error) {
      console.error('Error al descargar canvas:', error);
      return false;
    }
  }

  private generateFileName(qr: any, extension: string): string {
    const name = qr.name 
      ? qr.name.toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
      : `qr-${qr.id}`;
    
    return `${name}-${qr.id}.${extension}`;
  }
}
