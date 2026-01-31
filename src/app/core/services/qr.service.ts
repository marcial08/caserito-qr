import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { QRCode, PlanLimits } from '../models/qr.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface ScanResponse {
  success: boolean;
  data: {
    qrInfo: QRCode;
    menuData?: any;
  };
  message?: string;
}

export interface QrFilters {
  business_id?: string;
  category_id?: string;
  is_available?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QrService {
    private apiUrl = 'http://localhost:3000/api/qr';
  
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }


  // Datos mock para pruebas
  private mockQRCodes: QRCode[] = [
    {
      id: 1,
      name: 'QR General',
      slug: 'mi-restaurante',
      qr_color: '#2A9D8F',
      logo_enabled: true,
      scan_count: 45,
      last_scanned: '2024-01-15T10:30:00Z',
      url: 'https://menugr.pro/m/mi-restaurante',
      type: 'general'
    },
    {
      id: 2,
      name: 'Mesa 1',
      slug: 'mesa-1',
      qr_color: '#E76F51',
      logo_enabled: false,
      scan_count: 28,
      last_scanned: '2024-01-20T14:15:00Z',
      url: 'https://menugr.pro/m/mesa-1',
      type: 'table',
      table_number: 1,
      location: 'Terraza'
    },
    {
      id: 3,
      name: 'Mesa 2',
      slug: 'mesa-2',
      qr_color: '#E9C46A',
      logo_enabled: true,
      scan_count: 32,
      last_scanned: '2024-01-18T19:45:00Z',
      url: 'https://menugr.pro/m/mesa-2',
      type: 'table',
      table_number: 2,
      location: 'Interior'
    },
    {
      id: 4,
      name: 'Barra Principal',
      slug: 'barra',
      qr_color: '#264653',
      logo_enabled: true,
      scan_count: 67,
      last_scanned: '2024-01-22T21:00:00Z',
      url: 'https://menugr.pro/m/barra',
      type: 'general',
      location: 'Barra'
    },
    {
      id: 5,
      name: 'Mesa 3',
      slug: 'mesa-3',
      qr_color: '#E76F51',
      logo_enabled: false,
      scan_count: 19,
      last_scanned: '2024-01-16T12:30:00Z',
      url: 'https://menugr.pro/m/mesa-3',
      type: 'table',
      table_number: 3,
      location: 'Interior'
    }
  ];

  private mockPlanLimits: PlanLimits = {
    max_qr_codes: 20,
    numeric: {
      max_qr_codes: 20
    }
  };

 getQrs(filters?: QrFilters): Observable<QRCode[]> {
    return this.http.post<{ success: boolean; data: QRCode[] }>(
      `${this.apiUrl}/list`,
      filters || {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.map(qr => ({
            ...qr,
            created_at: new Date(qr.created_at?? ''),
            updated_at: new Date(qr.updated_at?? '')
          }));
        }
        throw new Error('Error en la respuesta del servidor');
      }),
      catchError(this.handleError)
    );
  }

  getQRCodes(): Observable<QRCode[]> {
    // Simular delay de API
    return of(this.mockQRCodes);
  }

  getPlanLimits(): Observable<PlanLimits> {
    return of(this.mockPlanLimits);
  }

  getQRCode(id: string | number): Observable<QRCode> {
    const qr = this.mockQRCodes.find(q => q.id == id);
    return of(qr || this.mockQRCodes[0]);
  }

  createQr(qrData: Omit<QRCode, 'id' | 'created_at' | 'updated_at'>): Observable<QRCode> {
      return this.http.post<{ success: boolean; data: QRCode }>(
        `${this.apiUrl}/create`,
        qrData,
        { headers: this.getHeaders() }
      ).pipe(
        map(response => {
          if (response.success) {
            const qr = response.data;
            return {
              ...qr
            };
          }
          throw new Error('Error en la respuesta del servidor');
        }),
        catchError(this.handleError)
      );
    }
  

  createQRCode(qrData: Partial<QRCode>): Observable<QRCode> {
    const newQR: QRCode = {
      id: Date.now(),
      name: qrData.name || 'Nuevo QR',
      slug: qrData.slug || 'nuevo-qr',
      qr_color: qrData.qr_color || '#2A9D8F',
      logo_enabled: qrData.logo_enabled || false,
      scan_count: 0,
      type: qrData.type || 'general',
      table_number: qrData.table_number,
      location: qrData.location,
      url: `https://menugr.pro/m/${qrData.slug || 'nuevo-qr'}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.mockQRCodes.push(newQR);
    return of(newQR);
  }

  updateQRCode(id: string | number, qrData: Partial<QRCode>): Observable<QRCode> {
    const index = this.mockQRCodes.findIndex(q => q.id == id);
    if (index !== -1) {
      this.mockQRCodes[index] = { ...this.mockQRCodes[index], ...qrData };
      return of(this.mockQRCodes[index]);
    }
    throw new Error('QR no encontrado');
  }

  deleteQRCode(id: string | number): Observable<boolean> {
    const index = this.mockQRCodes.findIndex(q => q.id == id);
    if (index !== -1) {
      this.mockQRCodes.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

    deleteQr(id: number): Observable<{ message: string }> {
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

    /**
   * Registra un escaneo de QR
   */
  registerScan(qrSlug: string, sessionData?: any): Observable<ScanResponse> {
    const data = {
      qr_slug: qrSlug,
      // session_id: this.generateSessionId(),
      // device_type: this.getDeviceType(),
      user_agent: navigator.userAgent,
      accessed_at: new Date().toISOString(),
      ...sessionData
    };

    return this.http.post<ScanResponse>(`${this.apiUrl}/qr-codes/scan`, data);
  }
}