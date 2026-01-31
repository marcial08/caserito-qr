import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Business } from '../../core/models/business.model';
import { filter } from 'rxjs/operators';

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

  menuItems = [
    { path: '/business/dashboard', label: 'Dashboard', icon: 'fa fa-th-large' },
    { path: '/business/menu', label: 'Mi Menú', icon: 'fa fa-utensils' },
    { path: '/business/categories', label: 'Categorías', icon: 'fa fa-tags' },
    { path: '/business/products', label: 'Productos', icon: 'fa fa-box' },
    { path: '/business/qr-codes', label: 'Códigos QR', icon: 'fa fa-qrcode' },
    { path: '/business/analytics', label: 'Reportes', icon: 'fa fa-chart-line' },
    { path: '/business/settings', label: 'Ajustes', icon: 'fa fa-sliders-h' },
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
   // this.currentBusiness = this.authService.getCurrentBusiness();
    this.updatePageTitle();

    // Actualizar título automáticamente al navegar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.updatePageTitle());
  }

  private updatePageTitle(): void {
    const currentRoute = this.menuItems.find(item => this.router.url.includes(item.path));
    this.pageTitle = currentRoute ? currentRoute.label : 'Panel';
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 1024; // Umbral de tablet/móvil
    if (!this.isMobile) this.mobileMenuOpen = false;
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