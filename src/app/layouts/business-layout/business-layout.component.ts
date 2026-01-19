import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Business } from '../../core/models/business.model';

@Component({
  selector: 'app-business-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './business-layout.component.html',
  styleUrls: ['./business-layout.component.scss']
})
export class BusinessLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  currentUser: any = null;
  currentBusiness: Business | null = null;
  currentPlan = 'Profesional';
  pageTitle = 'Dashboard';
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }
  
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentBusiness = this.authService.getCurrentBusiness();
    
    // Update page title based on route
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('dashboard')) this.pageTitle = 'Dashboard';
      else if (url.includes('menu')) this.pageTitle = 'Menú';
      else if (url.includes('products')) this.pageTitle = 'Productos';
      else if (url.includes('categories')) this.pageTitle = 'Categorías';
      else if (url.includes('qr-codes')) this.pageTitle = 'Códigos QR';
      else if (url.includes('analytics')) this.pageTitle = 'Analytics';
      else if (url.includes('settings')) this.pageTitle = 'Configuración';
    });
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false; // Cerrar menú móvil en desktop
    }
  }
  
  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }
  
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}