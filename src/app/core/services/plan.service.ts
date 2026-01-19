import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Plan, Subscription, PlanLimits } from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  
  getPlans(): Observable<Plan[]> {
    const plans: Plan[] = [
      {
        id: 'basic',
        name: 'basic',
        title: 'Básico',
        description: 'Perfecto para comenzar',
        price_monthly: 9.99,
        price_yearly: 99.99,
        currency: 'USD',
        features: [
          { name: 'Categorías', enabled: true, tooltip: 'Hasta 5 categorías' },
          { name: 'Productos', enabled: true, tooltip: 'Hasta 30 productos' },
          { name: 'Códigos QR', enabled: true, tooltip: 'Hasta 3 QR estáticos' },
          { name: 'Analytics básico', enabled: true },
          { name: 'Dominio personalizado', enabled: false },
          { name: 'Sin marca', enabled: false }
        ],
        limits: {
          numeric: {
            max_categories: 5,
            max_products: 30,
            max_qr_codes: 3,
            max_staff_users: 1,
            analytics_days: 30
          },
          features: {
            custom_domain: false,
            remove_branding: false
          }
        }
      },
      {
        id: 'professional',
        name: 'professional',
        title: 'Profesional',
        description: 'Para negocios en crecimiento',
        price_monthly: 24.99,
        price_yearly: 249.99,
        currency: 'USD',
        is_popular: true,
        features: [
          { name: 'Categorías', enabled: true, tooltip: 'Hasta 20 categorías' },
          { name: 'Productos', enabled: true, tooltip: 'Hasta 100 productos' },
          { name: 'Códigos QR', enabled: true, tooltip: 'Hasta 20 QR estáticos' },
          { name: 'Analytics avanzado', enabled: true },
          { name: 'Dominio personalizado', enabled: true },
          { name: 'Sin marca', enabled: false }
        ],
        limits: {
          numeric: {
            max_categories: 20,
            max_products: 100,
            max_qr_codes: 20,
            max_staff_users: 5,
            analytics_days: 90
          },
          features: {
            custom_domain: true,
            remove_branding: false
          }
        }
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        title: 'Empresarial',
        description: 'Para cadenas y franquicias',
        price_monthly: 49.99,
        price_yearly: 499.99,
        currency: 'USD',
        features: [
          { name: 'Categorías', enabled: true, tooltip: 'Categorías ilimitadas' },
          { name: 'Productos', enabled: true, tooltip: 'Hasta 500 productos' },
          { name: 'Códigos QR', enabled: true, tooltip: 'QR ilimitados' },
          { name: 'Analytics avanzado', enabled: true },
          { name: 'Dominio personalizado', enabled: true },
          { name: 'Sin marca', enabled: true }
        ],
        limits: {
          numeric: {
            max_categories: 100,
            max_products: 500,
            max_qr_codes: 100,
            max_staff_users: 20,
            analytics_days: 365
          },
          features: {
            custom_domain: true,
            remove_branding: true
          }
        }
      },
      {
        id: 'lifetime',
        name: 'lifetime',
        title: 'Pago Único',
        description: 'Acceso vitalicio',
        price_monthly: 0,
        price_yearly: 299.99,
        currency: 'USD',
        features: [
          { name: 'Categorías', enabled: true, tooltip: 'Hasta 10 categorías' },
          { name: 'Productos', enabled: true, tooltip: 'Hasta 50 productos' },
          { name: 'Códigos QR', enabled: true, tooltip: 'Hasta 10 QR estáticos' },
          { name: 'Analytics básico', enabled: true },
          { name: 'Dominio personalizado', enabled: false },
          { name: 'Sin marca', enabled: false }
        ],
        limits: {
          numeric: {
            max_categories: 10,
            max_products: 50,
            max_qr_codes: 10,
            max_staff_users: 2,
            analytics_days: 90
          },
          features: {
            custom_domain: false,
            remove_branding: false
          }
        }
      }
    ];

    return of(plans).pipe(delay(500));
  }

  getCurrentSubscription(): Observable<Subscription> {
    const subscription: Subscription = {
      id: 'sub-123',
      business_id: 'business-123',
      plan_type: 'professional', // Tipo específico
      status: 'active', // Tipo específico
      current_period_start: new Date('2024-01-01'),
      current_period_end: new Date('2024-12-31'),
      cancel_at_period_end: false,
      payment_method: 'stripe' // Tipo específico
    };
    
    return of(subscription).pipe(delay(400));
  }

  subscribeToPlan(planId: string, paymentMethod: 'monthly' | 'yearly' | 'lifetime'): Observable<{ success: boolean; message: string }> {
    return of({
      success: true,
      message: paymentMethod === 'lifetime' 
        ? '¡Pago único realizado con éxito! Acceso vitalicio activado.' 
        : `Suscripción al plan ${planId} activada correctamente.`
    }).pipe(delay(1500));
  }

  // Método auxiliar para obtener límites de un plan específico
  getPlanLimits(planName: 'basic' | 'professional' | 'enterprise' | 'lifetime'): Observable<PlanLimits> {
    return this.getPlans().pipe(
      delay(300),
      map(plans => {
        const plan = plans.find(p => p.name === planName);
        if (!plan) {
          throw new Error(`Plan ${planName} not found`);
        }
        return plan.limits;
      })
    );
  }

  // Método para cambiar de plan
  changePlan(newPlanId: string): Observable<{ success: boolean; message: string }> {
    return of({
      success: true,
      message: `Plan cambiado a ${newPlanId} correctamente.`
    }).pipe(delay(1200));
  }

  // Método para cancelar suscripción
  cancelSubscription(): Observable<{ success: boolean; message: string }> {
    return of({
      success: true,
      message: 'Suscripción cancelada. Tu plan seguirá activo hasta el final del período.'
    }).pipe(delay(1000));
  }
}

// Necesitas importar el operador map
import { map } from 'rxjs/operators';