import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

// Interfaces que deben coincidir con tu backend
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  primary_color: string;
  secondary_color: string;
  owner_id: string;
  is_active: boolean;


   email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  businessName: string;
  businessType: string;
  acceptedTerms: boolean;
}

interface RegisterResponse {
  user: User;
  business: Business;
  token: string;
  accepted_terms: boolean;
  created_at: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface BackendLoginResponse {
  success: boolean;
  data: {
    user: User;
    business: Business;
    token: string;
  };
}

interface LoginResponse {
  user: User;
  business: Business;
  token: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentBusinessSubject = new BehaviorSubject<Business | null>(null);
  
  currentUser$ = this.currentUserSubject.asObservable();
  currentBusiness$ = this.currentBusinessSubject.asObservable();
  
  // ¡¡¡IMPORTANTE!!! Cambia esto a la URL de tu backend
  private apiUrl = 'http://localhost:3000/api'; // Backend real
  
  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedBusiness = localStorage.getItem('currentBusiness');
      
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
      if (savedBusiness) {
        this.currentBusinessSubject.next(JSON.parse(savedBusiness));
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.clearStorage();
    }
  }

 register(data: RegisterData): Observable<any> {
  const registerData = {
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    password: data.password,
    businessName: data.businessName,
    businessType: data.businessType,
    acceptedTerms: data.acceptedTerms
  };

  console.log('📤 Enviando registro a:', `${this.apiUrl}/auth/register`);
  console.log('📦 Datos a enviar:', registerData);

  return this.http.post<any>(
    `${this.apiUrl}/auth/register`, 
    registerData
  ).pipe(
    tap(fullResponse => {
      console.log('🔍 RESPUESTA CRUDA DEL BACKEND:', fullResponse);
      
      // EXTRAER DATOS DE LA ESTRUCTURA {success: true, data: {...}}
      if (fullResponse && fullResponse.success && fullResponse.data) {
        const user = fullResponse.data.user;
        const business = fullResponse.data.business;
        const token = fullResponse.data.token;
        
        console.log('🔍 Datos extraídos:');
        console.log('  - User:', user);
        console.log('  - Business:', business);
        console.log('  - Token:', token);
        
        // Validar que los datos existen
        if (user && business && token) {
          console.log('✅ Datos válidos, guardando...');
          this.saveAuthData(user, business, token);
        } else {
          console.error('❌ Faltan datos en la respuesta:', {user, business, token});
        }
      } else {
        console.error('❌ Estructura de respuesta inválida:', fullResponse);
      }
    }),
    map(fullResponse => {
      // Para que el componente reciba la respuesta
      return fullResponse;
    }),
    catchError(error => {
      console.error('❌ Error HTTP en registro:', error);
      return throwError(() => error);
    })
  );
}
 login(credentials: LoginCredentials): Observable<LoginResponse> {
  console.log('📤 Enviando login a:', `${this.apiUrl}/auth/login`);
  
  return this.http.post<BackendLoginResponse>(
    `${this.apiUrl}/auth/login`, 
    credentials
  ).pipe(
    map(response => {
      if (!response.success || !response.data) {
        throw new Error('Respuesta del servidor inválida');
      }
      return response.data;
    }),
    tap(loginData => {
      console.log('✅ Login exitoso:', loginData);
      this.saveAuthData(loginData.user, loginData.business, loginData.token);
    }),
    catchError(error => {
      console.error('❌ Error en login:', error);
      return throwError(() => error);
    })
  );
}
// En tu auth.service.ts, método saveAuthData:
private saveAuthData(user: User, business: Business, token: string): void {
  // Asegurar que el negocio tenga todas las propiedades requeridas
  const businessWithDefaults: Business = {
    ...business,
    email: business.email || '',
    country: business.country || 'ES',
    timezone: business.timezone || 'Europe/Madrid',
    currency: business.currency || 'EUR'
  };
  
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('currentBusiness', JSON.stringify(businessWithDefaults));
  localStorage.setItem('token', token);
  this.currentUserSubject.next(user);
  this.currentBusinessSubject.next(businessWithDefaults);
}

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.currentBusinessSubject.next(null);
  }

  private clearStorage(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentBusiness');
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentBusiness(): Business | null {
    return this.currentBusinessSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }
    
    const token = this.getToken();
    
    return this.http.put<User>(
      `${this.apiUrl}/users/${currentUser.id}`, 
      userData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      tap(updatedUser => {
        this.currentUserSubject.next(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      })
    );
  }
}