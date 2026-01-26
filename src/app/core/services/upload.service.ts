import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ProductImage } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = 'http://localhost:3000/api'; // Ajusta tu URL base

  constructor(private http: HttpClient) {}

    // **Métodos para imágenes**
  getProductImages(productId: number): Observable<ProductImage[]> {
    return this.http.post<ProductImage[]>(`${this.apiUrl}/media/list`, {
      product_id: productId.toString()
    });
  }



  updateImage(imageId: number, data: { alt_text?: string; sort_order?: number; is_primary?: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/media/update`, {
      id: imageId.toString(),
      ...data
    });
  }

  deleteImage(imageId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/media/delete`, {
      id: imageId.toString()
    });
  }

  setPrimaryImage(entity_type: string, entity_id: number, media_id: number): Observable<any> {
    console.log('Setting primary image with params:', { entity_type, entity_id, media_id });
    return this.http.post(`${this.apiUrl}/media/set-primary`, {
      entity_type,
      entity_id,
      media_id: media_id
    });
  }

  reorderImages(productId: number, imageIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/media/reorder`, {
      product_id: productId.toString(),
      image_ids: imageIds.map(id => id.toString())
    });
  }

uploadProductImages(type: string, business_id: string, id: number, files: File[]): Observable<{ data: ProductImage[] }> {
  console.log('=== FRONTEND DEBUG ===');
  console.log('type:', type);
  console.log('business_id:', business_id);
  console.log('id:', id);
  console.log('files count:', files.length);
  files.forEach((file, i) => {
    console.log(`File ${i}:`, file.name, file.size, file.type);
  });

  const formData = new FormData();
  
  files.forEach(file => {
    console.log('Appending file:', file.name);
    formData.append('files', file, file.name);
  });
  
  formData.append('entity_id', id.toString());
  formData.append('entity_type', type);
  formData.append('business_id', business_id);

  // Verificar FormData
  console.log('FormData check:');
  for (let [key, value] of (formData as any).entries()) {
    console.log(key, value instanceof File ? `File: ${value.name}` : value);
  }

  return this.http.post<{ data: ProductImage[] }>(
    `${this.apiUrl}/media/upload`,
    formData
  ).pipe(
    tap(response => console.log('Response:', response)),
    catchError(error => {
      console.error('Error in upload:', error);
      if (error.status === 0) {
        console.error('Network error or CORS issue');
      }
      return throwError(() => error);
    })
  );
}
  
}