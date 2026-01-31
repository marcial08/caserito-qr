import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  passwordVisible = false;
  confirmPasswordVisible = false;
  acceptedTerms = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.pattern('^[0-9]{9,}$')]],
        businessName: ['', [Validators.required, Validators.minLength(2)]],
        businessType: ['restaurant', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator,
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  // Validador personalizado para fortaleza de contraseña
  private passwordStrengthValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};

    if (!hasUpperCase) errors['noUpperCase'] = true;
    if (!hasLowerCase) errors['noLowerCase'] = true;
    if (!hasNumbers) errors['noNumbers'] = true;
    if (!hasSpecialChar) errors['noSpecialChar'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Validador para confirmar que las contraseñas coincidan
  private passwordMatchValidator(
    form: AbstractControl,
  ): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }
  }

  getPasswordStrengthClass(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return 'strength-0';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return `strength-${strength}`;
  }

  getPasswordStrengthText(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return 'No establecida';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        return 'Muy débil';
      case 2:
        return 'Débil';
      case 3:
        return 'Media';
      case 4:
        return 'Fuerte';
      case 5:
        return 'Muy fuerte';
      default:
        return 'No establecida';
    }
  }

  // register.component.ts - Método onSubmit actualizado
  onSubmit(): void {
    console.log('=== REGISTRO INICIADO ===');

    if (this.registerForm.valid && this.acceptedTerms) {
      this.isLoading = true;

      const formData = {
        ...this.registerForm.value,
        acceptedTerms: this.acceptedTerms,
      };

      // Eliminar confirmPassword antes de enviar
      delete formData.confirmPassword;

      console.log('📤 Datos a enviar:', formData);

      this.authService.register(formData).subscribe({
        // register.component.ts - Línea 156 aproximadamente
        next: (response) => {
          console.log('✅ Registro exitoso - Respuesta completa:', response);

          // VERIFICACIÓN ERRÓNEA ACTUAL:
          // if (response && response.user && response.business && response.token) {

          // VERIFICACIÓN CORRECTA (porque la respuesta es {success: true, data: {...}}):
          if (
            response &&
            response.success &&
            response.data &&
            response.data.user &&
            response.data.business &&
            response.data.token
          ) {
            this.isLoading = false;
            this.toastr.success('¡Cuenta creada exitosamente!', 'Éxito');

            // Redirigir al dashboard
            console.log('🔄 Redirigiendo a dashboard...');
            this.router.navigate(['/business/dashboard']);
          } else {
            console.error('❌ Respuesta inválida:', response);
            this.toastr.error('Respuesta del servidor inválida', 'Error');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('❌ Error en registro:', error);
          this.isLoading = false;

          // Mostrar error específico
          let errorMessage = 'Error al crear la cuenta';

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.status === 409) {
            errorMessage = 'El email ya está registrado';
          } else if (error.status === 400) {
            errorMessage = 'Datos inválidos';
          }

          this.toastr.error(errorMessage, 'Error');

          // Debug adicional
          console.error('Status:', error.status);
          console.error('Error completo:', error);
        },
      });
    } else {
      console.log('❌ Formulario inválido o términos no aceptados');
      this.registerForm.markAllAsTouched();
      if (!this.acceptedTerms) {
        this.toastr.error('Debes aceptar los términos y condiciones', 'Error');
      }
    }
  }

  getFieldErrors(fieldName: string): string[] {
    const field = this.registerForm.get(fieldName);
    const errors: string[] = [];

    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        errors.push('Este campo es requerido');
      }
      if (field.errors['email']) {
        errors.push('Email inválido');
      }
      if (field.errors['minlength']) {
        errors.push(
          `Mínimo ${field.errors['minlength'].requiredLength} caracteres`,
        );
      }
      if (field.errors['pattern']) {
        errors.push('Formato inválido');
      }
      if (field.errors['noUpperCase']) {
        errors.push('Debe contener al menos una mayúscula');
      }
      if (field.errors['noLowerCase']) {
        errors.push('Debe contener al menos una minúscula');
      }
      if (field.errors['noNumbers']) {
        errors.push('Debe contener al menos un número');
      }
      if (field.errors['noSpecialChar']) {
        errors.push('Debe contener al menos un carácter especial');
      }
    }

    if (
      fieldName === 'confirmPassword' &&
      this.registerForm.errors?.['passwordMismatch']
    ) {
      errors.push('Las contraseñas no coinciden');
    }

    return errors;
  }

  getPasswordStrengthPercentage(): number {
    const strengthClass = this.getPasswordStrengthClass();
    const strength = parseInt(strengthClass.split('-')[1]);
    return strength * 20;
  }
}
