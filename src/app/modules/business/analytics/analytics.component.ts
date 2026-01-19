import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

interface AnalyticsData {
  period: string;
  total_scans: number;
  unique_scans: number;
  peak_hours: string[];
  popular_products: { name: string; scans: number }[];
  scan_trend: { date: string; count: number }[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  analyticsData: AnalyticsData | null = null;
  isLoading = false;
  selectedPeriod: string = '7d';

  constructor(
    private businessService: BusinessService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;

    // Mock data - In a real app, call businessService.getAnalytics(this.selectedPeriod)
    setTimeout(() => {
      this.analyticsData = {
        period: 'Últimos 7 días',
        total_scans: 245,
        unique_scans: 178,
        peak_hours: ['12:00-14:00', '20:00-22:00'],
        popular_products: [
          { name: 'Hamburguesa Clásica', scans: 45 },
          { name: 'Pizza Margarita', scans: 38 },
          { name: 'Ensalada César', scans: 29 },
          { name: 'Pasta Carbonara', scans: 27 },
          { name: 'Tarta de Chocolate', scans: 24 }
        ],
        scan_trend: [
          { date: 'Lun', count: 32 },
          { date: 'Mar', count: 28 },
          { date: 'Mié', count: 45 },
          { date: 'Jue', count: 39 },
          { date: 'Vie', count: 56 },
          { date: 'Sáb', count: 68 },
          { date: 'Dom', count: 57 }
        ]
      };
      this.isLoading = false;
    }, 1000);
  }

  onPeriodChange(): void {
    this.loadAnalytics();
  }

  getTrendIcon(trend: number): string {
    if (trend > 0) return 'fa-arrow-up text-success';
    if (trend < 0) return 'fa-arrow-down text-danger';
    return 'fa-minus text-muted';
  }

  getMaxScans(): number {
    if (!this.analyticsData?.scan_trend) return 100;
    return Math.max(...this.analyticsData.scan_trend.map(item => item.count));
  }

  getBarHeight(count: number): string {
    const max = this.getMaxScans();
    const percentage = (count / max) * 100;
    return `${percentage}%`;
  }
}