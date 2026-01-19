import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const businessGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const business = authService.getCurrentBusiness();
  
  if (business?.is_active) {
    return true;
  }
  
  router.navigate(['/plans']);
  return false;
};