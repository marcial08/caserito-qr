import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { Business, BusinessFormData } from '../../../core/models/business.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;
  business: Business | null = null;
  isLoading = false;
  isSubmitting = false;
  currentSection: string = 'general';

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private toastr: ToastrService
  ) {
    this.settingsForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadBusinessData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // General Settings
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.maxLength(20)],
      address: ['', Validators.maxLength(200)],
      city: ['', Validators.maxLength(50)],
      country: ['ES', Validators.required],
      timezone: ['Europe/Madrid', Validators.required],
      currency: ['EUR', Validators.required],
      
      // Appearance
      primary_color: ['#2A9D8F'],
      secondary_color: ['#264653'],
      font_family: ['Inter'],
      
      // Menu Settings
      show_prices: [true],
      show_images: [true],
      allow_comments: [false],
      tax_included: [true],
      tax_rate: [10],
      
      // Notifications
      email_notifications: [true],
      new_order_notification: [true],
      low_stock_notification: [false],
      promotion_notification: [true]
    });
  }

  private loadBusinessData(): void {
    this.isLoading = true;
    
    this.businessService.getBusiness().subscribe({
      next: (business) => {
        this.business = business;
        this.patchFormWithBusiness(business);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading business:', error);
        this.toastr.error('Error al cargar la información del negocio');
        this.isLoading = false;
      }
    });
  }

  private patchFormWithBusiness(business: Business): void {
    this.settingsForm.patchValue({
      name: business.name,
      email: business.email,
      phone: business.phone || '',
      address: business.address || '',
      city: business.city || '',
      country: business.country || 'ES',
      timezone: business.timezone || 'Europe/Madrid',
      currency: business.currency || 'EUR'
    });
  }

  setSection(section: string): void {
    this.currentSection = section;
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.markFormGroupTouched(this.settingsForm);
      this.toastr.error('Por favor, completa los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.settingsForm.value;

    // Prepare business data
    const businessData: BusinessFormData = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone || undefined,
      address: formValue.address || undefined,
      city: formValue.city || undefined,
      country: formValue.country,
      timezone: formValue.timezone,
      currency: formValue.currency,
      business_type: this.business?.business_type || 'restaurant'
    };

    this.businessService.updateBusiness(businessData).subscribe({
      next: () => {
        this.toastr.success('Configuración actualizada correctamente');
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating business:', error);
        this.toastr.error('Error al actualizar la configuración');
        this.isSubmitting = false;
      }
    });
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
    const control = this.settingsForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }
}