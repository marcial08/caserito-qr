import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  selectedPlan: Plan | null = null;
  isLoading = false;
  isSubmitting = false;
  planId: string = '';
  
  // Payment methods
  paymentMethods = [
    { id: 'card', name: 'Tarjeta de Crédito/Débito', icon: 'fa-credit-card' },
    { id: 'paypal', name: 'PayPal', icon: 'fa-paypal' },
    { id: 'bank', name: 'Transferencia Bancaria', icon: 'fa-university' }
  ];
  
  selectedPaymentMethod = 'card';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private toastr: ToastrService
  ) {
    this.checkoutForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.planId = params['planId'];
      this.loadPlanDetails();
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Billing Information
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['ES', Validators.required],
      postalCode: ['', Validators.required],
      
      // Card Information (if card selected)
      cardNumber: [''],
      cardExpiry: [''],
      cardCVC: [''],
      
      // Terms
      acceptTerms: [false, Validators.requiredTrue],
      subscribeNewsletter: [true]
    });
  }

  private loadPlanDetails(): void {
    this.isLoading = true;

    // Mock data - In a real app, call businessService.getPlan(this.planId)
    setTimeout(() => {
      const plans: { [key: string]: Plan } = {
        'plan-basic': {
          id: 'plan-basic',
          name: 'Básico',
          price: 9.99,
          currency: 'EUR',
          interval: 'month'
        },
        'plan-pro': {
          id: 'plan-pro',
          name: 'Profesional',
          price: 19.99,
          currency: 'EUR',
          interval: 'month'
        },
        'plan-enterprise': {
          id: 'plan-enterprise',
          name: 'Empresa',
          price: 49.99,
          currency: 'EUR',
          interval: 'month'
        }
      };

      this.selectedPlan = plans[this.planId] || null;
      this.isLoading = false;

      if (!this.selectedPlan) {
        this.toastr.error('Plan no encontrado');
        this.router.navigate(['/business/billing/plans']);
      }
    }, 500);
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    
    // Update validators based on payment method
    const cardNumber = this.checkoutForm.get('cardNumber');
    const cardExpiry = this.checkoutForm.get('cardExpiry');
    const cardCVC = this.checkoutForm.get('cardCVC');
    
    if (method === 'card') {
      cardNumber?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      cardExpiry?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      cardCVC?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    } else {
      cardNumber?.clearValidators();
      cardExpiry?.clearValidators();
      cardCVC?.clearValidators();
    }
    
    cardNumber?.updateValueAndValidity();
    cardExpiry?.updateValueAndValidity();
    cardCVC?.updateValueAndValidity();
  }

  getTotalAmount(): number {
    if (!this.selectedPlan) return 0;
    
    let total = this.selectedPlan.price;
    
    // Add VAT (21% in Spain)
    const vat = total * 0.21;
    return total + vat;
  }

  getVATAmount(): number {
    if (!this.selectedPlan) return 0;
    return this.selectedPlan.price * 0.21;
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      this.toastr.error('Por favor, completa todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;

    // Mock submission - In a real app, call businessService.processPayment()
    setTimeout(() => {
      this.isSubmitting = false;
      this.toastr.success('¡Pago procesado correctamente!', 'Éxito', {
        timeOut: 3000
      });
      
      // Redirect to invoices or success page
      this.router.navigate(['/business/billing/invoices']);
    }, 2000);
  }

  onCancel(): void {
    this.router.navigate(['/business/billing/plans']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.checkoutForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }

  // Format card number with spaces
  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    this.checkoutForm.get('cardNumber')?.setValue(formatted, { emitEvent: false });
  }

  // Format expiry date
  formatExpiryDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    this.checkoutForm.get('cardExpiry')?.setValue(value, { emitEvent: false });
  }
}