import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  plan: string;
  pdfUrl: string;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  isLoading = false;
  
  // Filtros
  statusFilter: string = 'all';
  dateFilter: string = 'all';
  searchTerm: string = '';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;
  
  // Ordenamiento
  sortField: keyof Invoice = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Estadísticas
  stats = {
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalInvoices: 0
  };

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    
    // Mock data - In a real app, call businessService.getInvoices()
    setTimeout(() => {
      this.invoices = [
        {
          id: '1',
          invoiceNumber: 'INV-2023-001',
          date: new Date('2023-10-01'),
          dueDate: new Date('2023-10-15'),
          amount: 29.99,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Profesional',
          pdfUrl: '#'
        },
        {
          id: '2',
          invoiceNumber: 'INV-2023-002',
          date: new Date('2023-10-15'),
          dueDate: new Date('2023-10-30'),
          amount: 29.99,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Profesional',
          pdfUrl: '#'
        },
        {
          id: '3',
          invoiceNumber: 'INV-2023-003',
          date: new Date('2023-11-01'),
          dueDate: new Date('2023-11-15'),
          amount: 29.99,
          currency: 'EUR',
          status: 'pending',
          plan: 'Plan Profesional',
          pdfUrl: '#'
        },
        {
          id: '4',
          invoiceNumber: 'INV-2023-004',
          date: new Date('2023-09-01'),
          dueDate: new Date('2023-09-15'),
          amount: 19.99,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Básico',
          pdfUrl: '#'
        },
        {
          id: '5',
          invoiceNumber: 'INV-2023-005',
          date: new Date('2023-08-15'),
          dueDate: new Date('2023-08-30'),
          amount: 19.99,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Básico',
          pdfUrl: '#'
        },
        {
          id: '6',
          invoiceNumber: 'INV-2023-006',
          date: new Date('2023-07-01'),
          dueDate: new Date('2023-07-15'),
          amount: 9.99,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Prueba',
          pdfUrl: '#'
        },
        {
          id: '7',
          invoiceNumber: 'INV-2023-007',
          date: new Date('2023-06-01'),
          dueDate: new Date('2023-06-15'),
          amount: 9.99,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Prueba',
          pdfUrl: '#'
        },
        {
          id: '8',
          invoiceNumber: 'INV-2023-008',
          date: new Date('2023-05-01'),
          dueDate: new Date('2023-05-15'),
          amount: 9.99,
          currency: 'EUR',
          status: 'cancelled',
          plan: 'Plan Prueba',
          pdfUrl: '#'
        },
        {
          id: '9',
          invoiceNumber: 'INV-2023-009',
          date: new Date('2023-04-15'),
          dueDate: new Date('2023-04-30'),
          amount: 0.00,
          currency: 'EUR',
          status: 'paid',
          plan: 'Plan Gratuito',
          pdfUrl: '#'
        },
        {
          id: '10',
          invoiceNumber: 'INV-2023-010',
          date: new Date('2023-11-15'),
          dueDate: new Date('2023-11-30'),
          amount: 59.99,
          currency: 'EUR',
          status: 'overdue',
          plan: 'Plan Empresa',
          pdfUrl: '#'
        }
      ];
      
      this.isLoading = false;
      this.applyFilters();
    }, 1000);
  }

  applyFilters(): void {
    let filtered = [...this.invoices];
    
    // Aplicar filtro de estado
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === this.statusFilter);
    }
    
    // Aplicar filtro de fecha
    if (this.dateFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const sixtyDaysAgo = new Date(now.setDate(now.getDate() - 60));
      
      switch (this.dateFilter) {
        case 'last30':
          filtered = filtered.filter(invoice => invoice.date >= thirtyDaysAgo);
          break;
        case 'last60':
          filtered = filtered.filter(invoice => invoice.date >= sixtyDaysAgo);
          break;
        case 'thisYear':
          const currentYear = new Date().getFullYear();
          filtered = filtered.filter(invoice => invoice.date.getFullYear() === currentYear);
          break;
      }
    }
    
    // Aplicar búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.plan.toLowerCase().includes(term)
      );
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];
      
      // Para fechas, convertir a timestamps
      if (this.sortField === 'date' || this.sortField === 'dueDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.filteredInvoices = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.calculateStats();
    
    // Asegurar que la página actual sea válida
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  calculateStats(): void {
    this.stats = {
      totalPaid: this.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
      totalPending: this.invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0),
      totalOverdue: this.invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
      totalInvoices: this.invoices.length
    };
  }

  get paginatedInvoices(): Invoice[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInvoices.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSort(field: keyof Invoice): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  downloadInvoice(invoice: Invoice): void {
    // In a real app, download the PDF
    this.toastr.info(`Descargando factura ${invoice.invoiceNumber}...`);
    
    // Mock download
    setTimeout(() => {
      this.toastr.success(`Factura ${invoice.invoiceNumber} descargada`);
    }, 500);
  }

  viewInvoice(invoice: Invoice): void {
    // In a real app, open PDF in new tab or modal
    window.open(invoice.pdfUrl, '_blank');
  }

  payInvoice(invoice: Invoice): void {
    // In a real app, redirect to payment page
    this.toastr.info(`Redirigiendo al pago de ${invoice.invoiceNumber}...`);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'overdue': return 'status-overdue';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  exportToCSV(): void {
    // In a real app, generate and download CSV
    this.toastr.info('Generando archivo CSV...');
    
    setTimeout(() => {
      this.toastr.success('CSV exportado correctamente');
    }, 1000);
  }

  printInvoices(): void {
    window.print();
  }

  getMin(a: number, b: number): number {
  return Math.min(a, b);
}
}