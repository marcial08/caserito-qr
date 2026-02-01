import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { Business, BusinessFormData } from '../models/business.model';
import { Category, Product } from '../models/menu.model';
import { QRCode } from '../models/qr.model';
import { PlanLimits, NumericLimits, PlanFeatures } from '../models/plan.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface BusinessFilters {
  business_id?: string;
  is_active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

    private apiUrl = 'http://localhost:3000/api/business';

   

  private businessLimits = new BehaviorSubject<PlanLimits | null>(null);
  
  // Mock data
  private mockCategories: Category[] = [
    {
      id: 1,
      business_id: 'business-123',
      name: 'Entradas',
      description: 'Aperitivos y entradas',
      display_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      product_count: 5
    },
    {
      id: 2,
      business_id: 'business-123',
      name: 'Platos Principales',
      description: 'Platos fuertes y especialidades',
      display_order: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      product_count: 12
    }
  ];

  private mockProducts: Product[] = [
    {
      id: 2,
      business_id: 'business-123',
      category_id: 2,
      name: 'Hamburguesa Clásica',
      description: 'Carne 100% vacuno, lechuga, tomate, queso cheddar',
      base_price: 12.99,
      compare_price: 14.99,
      is_available: true,
      tags: ['popular', 'carne'],
      sort_order: 1,
      created_at: new Date(),
      updated_at: new Date(),
      currency: 'EUR',
      images: [
        {
          id: 2,
          product_id: 1,
          url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
          alt_text: 'Hamburguesa clásica',
          sort_order: 1,
          is_primary: true
        }
      ]
    }
  ];

  private mockQRCodes: QRCode[] = [
    {
      id: 1,
      business_id: 'business-123',
      name: 'Mesa 1',
      slug: 'mesa-1',
      qr_color: '#2A9D8F',
      logo_enabled: true,
      scan_count: 45,
      last_scanned: new Date(),
      created_at: new Date(),
      url: 'https://menugr.pro/m/mesa-1'
    }
  ];

  constructor(private http: HttpClient) {
    // Set mock limits (Professional plan) con nueva estructura
    this.businessLimits.next({
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
    });
  }
    
      private getHeaders(): HttpHeaders {
        return new HttpHeaders({
          'Content-Type': 'application/json'
          // Aquí puedes agregar headers de autenticación si los necesitas
          // 'Authorization': `Bearer ${this.authService.getToken()}`
        });
      }

// Servicio
getBusiness(filters: { id: string }): Observable<Business> {
  return this.http.post<{ success: boolean; data: Business }>(
    `${this.apiUrl}/get`,
    filters,
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      if (response.success && response.data) {
        return { ...response.data };
      }
      throw new Error('No se encontró el negocio');
    }),
    catchError(this.handleError)
  );
}


  // getBusiness(): Observable<Business> {
  //   const mockBusiness: Business = {
  //     id: 'business-123',
  //     name: 'Mi Restaurante',
  //     slug: 'mi-restaurante',
  //     business_type: 'restaurant', // Especificar el tipo literal
  //     email: 'info@mirestaurante.com',
  //     phone: '+1234567890',
  //     address: 'Calle Principal 123',
  //     city: 'Ciudad',
  //     country: 'ES',
  //     logo_url: 'https://via.placeholder.com/200x200',
  //     cover_url: 'https://via.placeholder.com/1200x400',
  //     timezone: 'Europe/Madrid',
  //     currency: 'EUR',
  //     is_active: true,
  //     created_at: new Date(),
  //     updated_at: new Date()
  //   };
    
  //   return of(mockBusiness).pipe(delay(500));
  // }

  // updateBusiness(data: BusinessFormData): Observable<Business> {
  //   return this.getBusiness().pipe(
  //     map(business => ({ ...business, ...data }))
  //   );
  // }


  
  getProducts(): Observable<Product[]> {
    return of(this.mockProducts).pipe(delay(800));
  }

  createProduct(productData: any): Observable<Product> {
    const newProduct: Product = {
      ...productData,
      id: 1 + Date.now(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.mockProducts.push(newProduct);
    return of(newProduct).pipe(delay(800));
  }

  getQRCodes(): Observable<QRCode[]> {
    return of(this.mockQRCodes).pipe(delay(500));
  }

  generateQR(config: { name: string; qr_color?: string }): Observable<QRCode> {
    const newQR: QRCode = {
      id: 2,
      business_id: 'business-123',
      name: config.name,
      slug: config.name.toLowerCase().replace(/\s+/g, '-'),
      qr_color: config.qr_color || '#000000',
      logo_enabled: true,
      scan_count: 0,
      created_at: new Date(),
      url: `https://menugr.pro/m/${config.name.toLowerCase().replace(/\s+/g, '-')}`
    };
    this.mockQRCodes.push(newQR);
    return of(newQR).pipe(delay(1000));
  }

  getPlanLimits(): Observable<PlanLimits> {
    return this.businessLimits.asObservable() as Observable<PlanLimits>;
  }

  // Para límites numéricos (categorías, productos, QR codes, etc.)
  checkLimit(feature: keyof NumericLimits, currentUsage: number): Observable<{ 
    allowed: boolean; 
    limit: number; 
    remaining: number 
  }> {
    return this.getPlanLimits().pipe(
      map(limits => {
        const limitValue = limits.numeric[feature];
        return {
          allowed: currentUsage < limitValue,
          limit: limitValue,
          remaining: Math.max(0, limitValue - currentUsage)
        };
      })
    );
  }

  // Para características booleanas (dominio personalizado, sin marca, etc.)
  hasFeature(feature: keyof PlanFeatures): Observable<boolean> {
    return this.getPlanLimits().pipe(
      map(limits => limits.features[feature])
    );
  }

  // Método de conveniencia para verificar múltiples límites
  checkAllLimits(currentUsage: Partial<Record<keyof NumericLimits, number>>): Observable<Record<keyof NumericLimits, { allowed: boolean; limit: number; remaining: number }>> {
    return this.getPlanLimits().pipe(
      map(limits => {
        const result: Record<string, { allowed: boolean; limit: number; remaining: number }> = {};
        
        // Verificar cada límite numérico
        (Object.keys(limits.numeric) as Array<keyof NumericLimits>).forEach(key => {
          const limitValue = limits.numeric[key];
          const usage = currentUsage[key] || 0;
          
          result[key] = {
            allowed: usage < limitValue,
            limit: limitValue,
            remaining: Math.max(0, limitValue - usage)
          };
        });
        
        return result as Record<keyof NumericLimits, { allowed: boolean; limit: number; remaining: number }>;
      })
    );
  }

  // Método para obtener solo límites numéricos (útil para componentes)
  getNumericLimits(): Observable<NumericLimits> {
    return this.getPlanLimits().pipe(
      map(limits => limits.numeric)
    );
  }

  // Método para obtener solo características booleanas
  getFeatures(): Observable<PlanFeatures> {
    return this.getPlanLimits().pipe(
      map(limits => limits.features)
    );
  }

  // Método auxiliar para simular el uso actual de recursos
  getCurrentUsage(): Observable<Partial<Record<keyof NumericLimits, number>>> {
    return of({
      max_categories: this.mockCategories.length,
      max_products: this.mockProducts.length,
      max_qr_codes: this.mockQRCodes.length,
      max_staff_users: 1, // Solo el usuario actual
      analytics_days: 90 // Ya está en uso
    });
  }

  getCategories(): Observable<Category[]> {
  // Temporal: datos mock
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Entradas',
      description: 'Platos para comenzar tu comida',
      display_order: 1,
      is_active: true,
      cover_image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
      product_count: 8,
      created_at: new Date(),
      updated_at: new Date(),
      business_id: 'business-123'
    },
    {
      id: 2,
      name: 'Platos Principales',
      description: 'Nuestros platos más destacados',
      display_order: 2,
      is_active: true,
      cover_image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
      product_count: 15,
      created_at: new Date(),
      updated_at: new Date(), 
      business_id: 'business-123'
    },
    // ... más categorías
  ];
  
  return of(mockCategories);
}
  private handleError(error: any): Observable<never> {
    console.error('Error en CategoryService:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

}