import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { businessGuard } from './core/guards/business.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () =>
      import('./modules/public/landing/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/public/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./modules/public/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'menu/:slug',
    loadComponent: () =>
      import('./modules/public/menu-view/menu-view.component').then(
        (m) => m.MenuViewComponent,
      ),
  },
  {
    path: 'm/:slug',  // Ruta para códigos QR (usa el mismo componente)
    loadComponent: () =>
      import('./modules/public/menu-view/menu-view.component').then(
        (m) => m.MenuViewComponent,
      ),
  },
  //   {
  //     path: 'demo',
  //     loadComponent: () => import('./modules/public/menu-view/public-menu.component').then(m => m.PublicMenuComponent)
  //   },

  // Business routes (protected)
  {
    path: 'business',
    loadComponent: () =>
      import('./layouts/business-layout/business-layout.component').then(
        (m) => m.BusinessLayoutComponent,
      ),
    canActivate: [authGuard, businessGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/business/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./modules/business/menu-management/menu-management.component').then(
            (m) => m.MenuManagementComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./modules/business/categories/list/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import('./modules/business/categories/category-form/category-form.component').then(
            (m) => m.CategoryFormComponent,
          ),
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () =>
          import('./modules/business/categories/category-form/category-form.component').then(
            (m) => m.CategoryFormComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./modules/business/products/list/products.component').then(
            (m) => m.ProductsComponent,
          ),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./modules/business/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./modules/business/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'promotions',
        loadComponent: () =>
          import('./modules/business/promotions/promotions.component').then(
            (m) => m.PromotionsComponent,
          ),
      },
      {
        path: 'qr-codes',
        loadComponent: () =>
          import('./modules/business/qr-codes/qr-codes.component').then(
            (m) => m.QrCodesComponent,
          ),
      },
      {
        path: 'qr-codes/new',
        loadComponent: () =>
          import('./modules/business/qr-form/qr-form.component').then(
            (m) => m.QrFormComponent,
          ),
      },
      {
        path: 'qr-codes/:id/edit',
        loadComponent: () =>
          import('./modules/business/qr-form/qr-form.component').then(
            (m) => m.QrFormComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./modules/business/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./modules/business/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Billing routes
  {
    path: 'billing',
    canActivate: [authGuard],
    children: [
      {
        path: 'plans',
        loadComponent: () =>
          import('./modules/billing/plans/plans.component').then(
            (m) => m.PlansComponent,
          ),
      },
      {
        path: 'checkout/:planId',
        loadComponent: () =>
          import('./modules/billing/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./modules/billing/invoices/invoices.component').then(
            (m) => m.InvoicesComponent,
          ),
      },
    ],
  },

  // Fallback route
  {
    path: '**',
    loadComponent: () =>
      import('./modules/public/landing/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
  },
];
