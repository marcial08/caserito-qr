import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Category } from '../models/menu.model';

export interface CategoryFilters {
  business_id?: string;
  is_active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000/api/categories';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
      // Aquí puedes agregar headers de autenticación si los necesitas
      // 'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  // Obtener todas las categorías con filtros opcionales
  getCategories(filters?: CategoryFilters): Observable<Category[]> {
    return this.http.post<{ success: boolean; data: Category[] }>(
      `${this.apiUrl}/list`,
      filters || {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          // Convertir strings de fecha a objetos Date
          return response.data.map(category => ({
            ...category,
            created_at: new Date(category.created_at),
            updated_at: new Date(category.updated_at)
          }));
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Obtener una categoría por ID
  getCategoryById(id: string): Observable<Category> {
    return this.http.post<{ success: boolean; data: Category }>(
      `${this.apiUrl}/get`,
      { id },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          // Convertir strings de fecha a objetos Date
          return {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at)
          };
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Crear una nueva categoría
  createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'product_count'>): Observable<Category> {
    return this.http.post<{ success: boolean; data: Category }>(
      `${this.apiUrl}/create`,
      categoryData,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at)
          };
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Actualizar una categoría existente
  updateCategory(id: string, categoryData: Partial<Category>): Observable<Category> {
    // Remover campos que no se deben actualizar
    const { id: _, created_at, updated_at, product_count, ...updateData } = categoryData;
    
    return this.http.post<{ success: boolean; data: Category }>(
      `${this.apiUrl}/update`,
      { id, ...updateData },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return {
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: new Date(response.data.updated_at)
          };
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  // Eliminar una categoría
  deleteCategory(id: string): Observable<{ message: string }> {
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