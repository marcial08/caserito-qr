import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    included: string[];
    not_included: string[];
  };
  limits: {
    max_products: number;
    max_categories: number;
    max_qr_codes: number;
    max_staff_users: number;
    analytics_days: number;
  };
  is_popular?: boolean;
  is_current?: boolean;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  plans: Plan[] = [];
  currentPlan: Plan | null = null;
  isLoading = false;
  billingInterval: 'month' | 'year' = 'month';

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;

    // Mock data - In a real app, call businessService.getPlans()
    setTimeout(() => {
      this.plans = [
        {
          id: 'plan-basic',
          name: 'Básico',
          description: 'Perfecto para comenzar',
          price: 9.99,
          currency: 'EUR',
          interval: 'month',
          features: {
            included: [
              'Hasta 50 productos',
              '10 categorías',
              '5 códigos QR',
              '1 usuario staff',
              '30 días de analíticas',
              'Soporte por email'
            ],
            not_included: [
              'Dominio personalizado',
              'Sin marca MenuGR',
              'Usuarios staff ilimitados',
              'Analíticas avanzadas',
              'Soporte prioritario'
            ]
          },
          limits: {
            max_products: 50,
            max_categories: 10,
            max_qr_codes: 5,
            max_staff_users: 1,
            analytics_days: 30
          },
          is_current: true
        },
        {
          id: 'plan-pro',
          name: 'Profesional',
          description: 'Para negocios en crecimiento',
          price: 19.99,
          currency: 'EUR',
          interval: 'month',
          features: {
            included: [
              'Hasta 200 productos',
              '30 categorías',
              '20 códigos QR',
              '5 usuarios staff',
              '90 días de analíticas',
              'Dominio personalizado',
              'Sin marca MenuGR',
              'Soporte prioritario'
            ],
            not_included: [
              'Usuarios staff ilimitados',
              'Analíticas avanzadas',
              'Soporte 24/7'
            ]
          },
          limits: {
            max_products: 200,
            max_categories: 30,
            max_qr_codes: 20,
            max_staff_users: 5,
            analytics_days: 90
          },
          is_popular: true
        },
        {
          id: 'plan-enterprise',
          name: 'Empresa',
          description: 'Para negocios establecidos',
          price: 49.99,
          currency: 'EUR',
          interval: 'month',
          features: {
            included: [
              'Productos ilimitados',
              'Categorías ilimitadas',
              'Códigos QR ilimitados',
              'Usuarios staff ilimitados',
              'Analíticas avanzadas (1 año)',
              'Dominio personalizado',
              'Sin marca MenuGR',
              'Soporte 24/7',
              'Migración asistida',
              'API access'
            ],
            not_included: []
          },
          limits: {
            max_products: 9999,
            max_categories: 999,
            max_qr_codes: 999,
            max_staff_users: 999,
            analytics_days: 365
          }
        }
      ];

      this.currentPlan = this.plans.find(p => p.is_current) || null;
      this.isLoading = false;
    }, 800);
  }

  toggleBillingInterval(): void {
    this.billingInterval = this.billingInterval === 'month' ? 'year' : 'month';
    
    // Update prices based on interval
    this.plans.forEach(plan => {
      if (this.billingInterval === 'year') {
        // Apply 20% discount for yearly billing
        plan.price = parseFloat((plan.price * 12 * 0.8).toFixed(2));
      } else {
        // Reset to monthly prices
        const basePrices = {
          'plan-basic': 9.99,
          'plan-pro': 19.99,
          'plan-enterprise': 49.99
        };
        plan.price = basePrices[plan.id as keyof typeof basePrices] || plan.price;
      }
    });
  }

  getAnnualSavings(plan: Plan): number {
    if (this.billingInterval === 'year') {
      const monthlyTotal = this.getBaseMonthlyPrice(plan.id) * 12;
      return monthlyTotal - plan.price;
    }
    return 0;
  }

  getBaseMonthlyPrice(planId: string): number {
    const basePrices = {
      'plan-basic': 9.99,
      'plan-pro': 19.99,
      'plan-enterprise': 49.99
    };
    return basePrices[planId as keyof typeof basePrices] || 0;
  }

  selectPlan(plan: Plan): void {
    this.router.navigate(['/business/billing/checkout', plan.id]);
  }

  getCurrentUsage(): any {
    // In a real app, get current usage from businessService
    return {
      products: 12,
      categories: 3,
      qr_codes: 2,
      staff_users: 1
    };
  }

  isPlanSufficient(plan: Plan): boolean {
    const usage = this.getCurrentUsage();
    return (
      usage.products <= plan.limits.max_products &&
      usage.categories <= plan.limits.max_categories &&
      usage.qr_codes <= plan.limits.max_qr_codes &&
      usage.staff_users <= plan.limits.max_staff_users
    );
  }
}