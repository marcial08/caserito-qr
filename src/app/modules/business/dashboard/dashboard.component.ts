import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { PlanService } from '../../../core/services/plan.service';
import { QRCode } from '../../../core/models/qr.model';
import { Category, Product } from '../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  businessName = 'Mi Restaurante';
  products: Product[] = [];
  categories: Category[] = [];
  qrCodes: QRCode[] = [];
  planLimits: any = null;
  currentPlan: any = null;
  isLoading = false;
  
  recentActivity = [
    { icon: 'plus', description: 'Producto "Hamburguesa Especial" creado', time: 'Hace 2 horas' },
    { icon: 'qrcode', description: 'QR para "Mesa 5" generado', time: 'Hace 1 día' },
    { icon: 'edit', description: 'Categoría "Postres" actualizada', time: 'Hace 2 días' }
  ];
  
  get activeProductsCount(): number {
    return this.products.filter(p => p.is_available).length;
  }

  constructor(
    private businessService: BusinessService,
    private planService: PlanService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    this.businessService.getProducts().subscribe(products => {
      this.products = products;
    });
    
    this.businessService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
    
    this.businessService.getQRCodes().subscribe(qrCodes => {
      this.qrCodes = qrCodes;
    });
    
    this.businessService.getPlanLimits().subscribe(limits => {
      this.planLimits = limits;
    });
    
    this.planService.getCurrentSubscription().subscribe(subscription => {
      this.planService.getPlans().subscribe(plans => {
        this.currentPlan = plans.find(p => p.name === subscription.plan_type);
        this.isLoading = false;
      });
    });
  }
}