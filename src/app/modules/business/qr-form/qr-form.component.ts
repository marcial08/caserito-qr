import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { ToastrService } from 'ngx-toastr';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { QrService } from '../../../core/services/qr.service';
import { scan } from 'rxjs';

@Component({
  selector: 'app-qr-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './qr-form.component.html',
  styleUrls: ['./qr-form.component.scss'],
})
export class QrFormComponent implements OnInit {
  isEditMode = false;
  qrId: string | null = null;
  isLoading = false;
  isSubmitting = false;

    private businessId = '8d3b46cb-afb7-49f8-bfea-2d64bef2d4eb';

  // Form
  qrForm: FormGroup;

  // Color options
  colorOptions = [
    { value: '#2A9D8F', name: 'Verde Principal', class: 'color-primary' },
    { value: '#E76F51', name: 'Naranja', class: 'color-secondary' },
    { value: '#E9C46A', name: 'Amarillo', class: 'color-warning' },
    { value: '#264653', name: 'Azul Oscuro', class: 'color-dark' },
    { value: '#F4A261', name: 'Naranja Claro', class: 'color-info' },
    { value: '#2196F3', name: 'Azul', class: 'color-blue' },
    { value: '#9C27B0', name: 'Púrpura', class: 'color-purple' },
    { value: '#F44336', name: 'Rojo', class: 'color-red' },
  ];

  // Tipo de QR
  qrTypes = [
    {
      value: 'general',
      name: 'QR General',
      icon: 'qrcode',
      description: 'Un código QR único para todo tu negocio',
    },
    {
      value: 'table',
      name: 'QR de Mesa',
      icon: 'utensils',
      description: 'Códigos específicos para cada mesa o ubicación',
    },
  ];

  // Preview URL
  previewUrl = 'https://menugr.pro/m/';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private toastr: ToastrService,
    private qrService: QrService,
    private fb: FormBuilder,
  ) {
    this.qrForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.qrId = params['id'];
        this.loadQRData();
      } else {
        this.setupFormListeners();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],
      type: ['general', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      qr_color: ['#2A9D8F', Validators.required],
      logo_enabled: [false],
      table_number: [null],
      location: [''],
      redirect_url: [''],
      description: [''],
    });
  }

  setupFormListeners(): void {
    // Auto-generate slug from name
    this.qrForm.get('name')?.valueChanges.subscribe((name) => {
      if (name && !this.isEditMode && !this.qrForm.get('slug')?.dirty) {
        const slug = this.generateSlug(name);
        this.qrForm.get('slug')?.setValue(slug, { emitEvent: false });
        this.updatePreviewUrl();
      }
    });

    // Update preview when slug changes
    this.qrForm.get('slug')?.valueChanges.subscribe(() => {
      this.updatePreviewUrl();
    });

    // Reset table_number when type changes to general
    this.qrForm.get('type')?.valueChanges.subscribe((type) => {
      if (type === 'general') {
        this.qrForm.get('table_number')?.setValue(null);
      }
      this.updatePreviewUrl();
    });
  }

  loadQRData(): void {
    if (!this.qrId) return;

    this.isLoading = true;
    this.qrService.getQRCode(this.qrId).subscribe({
      next: (qr) => {
        this.qrForm.patchValue({
          name: qr.name,
          type: qr.type || 'general',
          slug: qr.slug,
          qr_color: qr.qr_color || '#2A9D8F',
          logo_enabled: qr.logo_enabled || false,
          table_number: qr.table_number || null,
          location: qr.location || '',
          redirect_url: qr.url || '',
          description: '',
        });

        this.updatePreviewUrl();
        this.setupFormListeners();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar el QR', 'Error');
        this.router.navigate(['/business/qr-codes']);
        this.isLoading = false;
      },
    });
  }

  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  updatePreviewUrl(): void {
    const slug = this.qrForm.get('slug')?.value;
    this.previewUrl = `https://menugr.pro/m/${slug || 'ejemplo'}`;
  }

  validateSlug(): void {
    const slugControl = this.qrForm.get('slug');
    if (slugControl?.value) {
      const slug = slugControl.value.toLowerCase().trim();
      slugControl.setValue(this.generateSlug(slug));
    }
  }

  onSubmit(): void {
    if (this.qrForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.qrForm);
      return;
    }

    this.isSubmitting = true;
    const formData = this.qrForm.value;

    // Prepare data for API
    const qrData = {
      name: formData.name.trim(),
      type: formData.type,
      slug: formData.slug.trim(),
      qr_color: formData.qr_color,
      logo_enabled: formData.logo_enabled,
      table_number: formData.type === 'table' ? formData.table_number : null,
      location: formData.location.trim(),
      redirect_url: formData.redirect_url.trim(),
      Url: formData.redirect_url.trim(),
      business_id: this.businessId,
      scan_count: 0,
      status: 'active'
    };

    const saveObservable =
      this.isEditMode && this.qrId
        ? this.qrService.updateQRCode(this.qrId, qrData)
        : this.qrService.createQr(qrData);

    saveObservable.subscribe({
      next: (qr) => {
        const message = this.isEditMode
          ? 'QR actualizado correctamente'
          : 'QR creado correctamente';

        this.toastr.success(message, 'Éxito');
        this.router.navigate(['/business/qr-codes']);
      },
      error: (error: any) => {
        console.error('Error saving QR:', error);
        this.toastr.error(error.message || 'Error al guardar el QR', 'Error');
        this.isSubmitting = false;
      },
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/business/qr-codes']);
  }

  // Helper getters for template
  get name() {
    return this.qrForm.get('name');
  }
  get slug() {
    return this.qrForm.get('slug');
  }
  get type() {
    return this.qrForm.get('type');
  }
  get tableNumber() {
    return this.qrForm.get('table_number');
  }
  get qrColor() {
    return this.qrForm.get('qr_color');
  }

  // Check if type is table
  get isTableType(): boolean {
    return this.qrForm.get('type')?.value === 'table';
  }
}
