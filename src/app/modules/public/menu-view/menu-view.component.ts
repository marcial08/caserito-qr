import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BusinessService } from '../../../core/services/business.service';
import { Category, Product } from '../../../core/models/menu.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface Cart {
  items: CartItem[];
  total: number;
}

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    CurrencyPipe
  ],
  templateUrl: './menu-view.component.html',
  styleUrls: ['./menu-view.component.scss']
})
export class MenuViewComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;
  businessInfo: any = null;

   currentYear = new Date().getFullYear();
  
  // Active category
  activeCategoryId: string = 'all';
  searchTerm: string = '';
  
  // Cart
  cart: Cart = {
    items: [],
    total: 0
  };
  
  // UI States
  showCart = false;
  showProductModal = false;
  showCategoryFilter = false;
  selectedProduct: Product | null = null;
  selectedQuantity = 1;
  productNotes = '';
  
  // Responsive
  isMobile = false;
  isTablet = false;
  
  private destroy$ = new Subject<void>();
  private slug: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkViewport();
    this.loadBusinessData();
    this.loadCartFromStorage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  private checkViewport(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
      this.isTablet = window.innerWidth >= 768 && window.innerWidth < 992;
    }
  }

  private loadBusinessData(): void {
    this.isLoading = true;

    // Get business slug from URL or use default
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.slug = params['slug'] || 'demo';
      this.loadMenuData();
    });

    // Load business info
    this.businessService.getBusiness().subscribe({
      next: (business) => {
        this.businessInfo = business;
      },
      error: (error) => {
        console.error('Error loading business:', error);
        // Continue with default data
      }
    });
  }

  private loadMenuData(): void {
    this.businessService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories
          .filter(cat => cat.is_active)
          .sort((a, b) => a.display_order - b.display_order);
        
        this.businessService.getProducts().subscribe({
          next: (products) => {
            this.products = products.filter(p => p.is_available);
            this.filteredProducts = [...this.products];
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading products:', error);
            this.toastr.error('Error al cargar el menú');
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar el menú');
        this.isLoading = false;
      }
    });
  }

  // Filtering
  filterByCategory(categoryId: string): void {
    this.activeCategoryId = categoryId;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    // Filter by category
    if (this.activeCategoryId !== 'all') {
      filtered = filtered.filter(product => product.category_id === this.activeCategoryId);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    this.filteredProducts = filtered;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  getProductsByCategory(categoryId: string): Product[] {
    return this.filteredProducts.filter(p => p.category_id === categoryId);
  }

  // Product Modal
  openProductModal(product: Product): void {
    this.selectedProduct = product;
    this.selectedQuantity = 1;
    this.productNotes = '';
    this.showProductModal = true;
    
    // Prevent body scroll
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.selectedProduct = null;
    
    // Restore body scroll
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  incrementQuantity(): void {
    this.selectedQuantity++;
  }

  decrementQuantity(): void {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

  // Cart Management
  addToCart(): void {
    if (!this.selectedProduct) return;

    const cartItem: CartItem = {
      product: this.selectedProduct,
      quantity: this.selectedQuantity,
      notes: this.productNotes.trim() || undefined
    };

    // Check if product already in cart
    const existingIndex = this.cart.items.findIndex(
      item => item.product.id === cartItem.product.id && item.notes === cartItem.notes
    );

    if (existingIndex > -1) {
      // Update quantity if same product with same notes
      this.cart.items[existingIndex].quantity += cartItem.quantity;
    } else {
      // Add new item
      this.cart.items.push(cartItem);
    }

    this.updateCartTotal();
    this.saveCartToStorage();
    this.closeProductModal();
    
    this.toastr.success(`${cartItem.product.name} agregado al carrito`, '¡Perfecto!', {
      timeOut: 2000,
      positionClass: this.isMobile ? 'toast-bottom-center' : 'toast-top-right'
    });
  }

  removeFromCart(itemIndex: number): void {
    this.cart.items.splice(itemIndex, 1);
    this.updateCartTotal();
    this.saveCartToStorage();
  }

  updateCartItemQuantity(itemIndex: number, change: number): void {
    const newQuantity = this.cart.items[itemIndex].quantity + change;
    if (newQuantity >= 1) {
      this.cart.items[itemIndex].quantity = newQuantity;
      this.updateCartTotal();
      this.saveCartToStorage();
    }
  }

  updateCartTotal(): void {
    this.cart.total = this.cart.items.reduce((sum, item) => {
      return sum + (item.product.base_price * item.quantity);
    }, 0);
  }

  getCartItemTotal(item: CartItem): number {
    return item.product.base_price * item.quantity;
  }

  getCartItemCount(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  toggleCart(): void {
    this.showCart = !this.showCart;
    
    if (this.showCart && isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    } else if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  clearCart(): void {
    if (this.cart.items.length === 0) return;
    
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      this.cart.items = [];
      this.cart.total = 0;
      this.saveCartToStorage();
      this.toastr.info('Carrito vaciado');
    }
  }

  // Checkout
  proceedToCheckout(): void {
    if (this.cart.items.length === 0) {
      this.toastr.warning('Agrega productos al carrito primero');
      return;
    }

    this.toastr.success('Redirigiendo al checkout...', '¡Perfecto!');
    // In a real app, you would navigate to checkout page
    // this.router.navigate(['/checkout']);
  }

  // Local Storage
  private saveCartToStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`cart_${this.slug}`, JSON.stringify(this.cart));
    }
  }

  private loadCartFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedCart = localStorage.getItem(`cart_${this.slug}`);
      if (savedCart) {
        try {
          this.cart = JSON.parse(savedCart);
          // Ensure cart items have proper Product objects
          this.cart.items.forEach(item => {
            // In a real app, you might want to fetch fresh product data
          });
        } catch (error) {
          console.error('Error loading cart from storage:', error);
        }
      }
    }
  }

  // Helper methods
  getProductImageUrl(product: Product): string {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
      return primaryImage.url;
    }
    return 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80';
  }

  formatPrice(price: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  getDiscountPercentage(product: Product): number {
    if (product.compare_price && product.compare_price > product.base_price) {
      return Math.round(((product.compare_price - product.base_price) / product.compare_price) * 100);
    }
    return 0;
  }

  toggleCategoryFilter(): void {
    this.showCategoryFilter = !this.showCategoryFilter;
  }

  // Share menu
  shareMenu(): void {
    if (isPlatformBrowser(this.platformId) && navigator.share) {
      navigator.share({
        title: this.businessInfo?.name || 'Menú Digital',
        text: `Mira el menú de ${this.businessInfo?.name || 'este negocio'}`,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.toastr.success('URL copiada al portapapeles', '¡Compartido!');
      });
    }
  }
}