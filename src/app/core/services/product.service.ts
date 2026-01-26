import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product, ProductImage, ProductVariant } from '../models/menu.model';

export interface ProductFilters {
  business_id?: string;
  category_id?: string;
  is_available?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Obtener todos los productos con filtros
  getProducts(filters?: ProductFilters): Observable<Product[]> {
    return this.http.post<{ success: boolean; data: Product[] }>(
      `${this.apiUrl}/list`,
      filters || {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.map(product => ({
            ...product,
            created_at: new Date(product.created_at),
            updated_at: new Date(product.updated_at),
            tags: product.tags || [],
            images: product.images || [],
            variants: product.variants || []
          }));
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Obtener un producto por ID
  getProductById(id: number): Observable<Product> {
    return this.http.post<{ success: boolean; data: Product }>(
      `${this.apiUrl}/get`,
      { id },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          const product = response.data;
          return {
            ...product,
            created_at: new Date(product.created_at),
            updated_at: new Date(product.updated_at),
            tags: product.tags || [],
            images: product.images || [],
            variants: product.variants || []
          };
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Crear un nuevo producto
  createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Observable<Product> {
    return this.http.post<{ success: boolean; data: Product }>(
      `${this.apiUrl}/create`,
      productData,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          const product = response.data;
          return {
            ...product,
            created_at: new Date(product.created_at),
            updated_at: new Date(product.updated_at)
          };
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Actualizar un producto existente
  updateProduct(id: number, productData: Partial<Product>): Observable<Product> {
    // Remover campos que no se deben actualizar
    const { id: _, created_at, updated_at, images, variants, category, ...updateData } = productData;
    
    return this.http.post<{ success: boolean; data: Product }>(
      `${this.apiUrl}/update`,
      { id, ...updateData },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          const product = response.data;
          return {
            ...product,
            created_at: new Date(product.created_at),
            updated_at: new Date(product.updated_at)
          };
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Eliminar un producto
  deleteProduct(id: number): Observable<{ message: string }> {
    return this.http.post<{ success: boolean; data: { message: string } }>(
      `${this.apiUrl}/delete`,
      { id },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Manejo centralizado de errores
  private handleError(error: any): Observable<never> {
    console.error('Error en ProductService:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
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