import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { User, LoginCredentials, RegisterData } from '../models/user.model';
import { Business } from '../models/business.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentBusinessSubject = new BehaviorSubject<Business | null>(null);
  
  currentUser$ = this.currentUserSubject.asObservable();
  currentBusiness$ = this.currentBusinessSubject.asObservable();
  
  private apiUrl = 'api'; // Mock API base URL

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage en inicialización
    const savedUser = localStorage.getItem('currentUser');
    const savedBusiness = localStorage.getItem('currentBusiness');
    
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
    if (savedBusiness) {
      this.currentBusinessSubject.next(JSON.parse(savedBusiness));
    }
  }

  login(credentials: LoginCredentials): Observable<{ user: User; business: Business; token: string }> {
    // Mock response
    const mockResponse = {
      user: {
        id: 'user-123',
        business_id: 'business-123',
        email: credentials.email,
        name: 'Juan Pérez',
        role: 'owner' as const,
        permissions: {
          menu: true,
          analytics: true,
          billing: true,
          settings: true
        },
        created_at: new Date()
      },
      business: {
        id: 'business-123',
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        business_type: 'restaurant' as const,
        email: 'info@mirestaurante.com',
        phone: '+1234567890',
        address: 'Calle Principal 123',
        city: 'Ciudad',
        country: 'ES',
        timezone: 'Europe/Madrid',
        currency: 'EUR',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      token: 'mock-jwt-token-123456'
    };

    return of(mockResponse).pipe(
      delay(1000), // Simular delay de red
      tap(response => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('currentBusiness', JSON.stringify(response.business));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
        this.currentBusinessSubject.next(response.business);
      })
    );
  }

  register(data: RegisterData): Observable<{ success: boolean; message: string }> {
    return of({ success: true, message: 'Registro exitoso' }).pipe(delay(1500));
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentBusiness');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.currentBusinessSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentBusiness(): Business | null {
    return this.currentBusinessSubject.value;
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    const updatedUser = { ...currentUser, ...userData };
    return of(updatedUser).pipe(
      delay(800),
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }
}