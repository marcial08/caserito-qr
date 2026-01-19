import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state text-center py-5">
      <div class="empty-state-icon mb-4">
        <i class="fa fa-{{ icon }} fa-3x text-muted"></i>
      </div>
      <h4 class="mb-3">{{ title }}</h4>
      @if (description) {
        <p class="text-muted mb-4">{{ description }}</p>
      }
      @if (actionText) {
        <button 
          class="btn btn-primary"
          (click)="onAction.emit()">
          @if (actionIcon) {
            <i class="fa fa-{{ actionIcon }} me-2"></i>
          }
          {{ actionText }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      max-width: 400px;
      margin: 0 auto;
    }
    
    .empty-state-icon {
      opacity: 0.5;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No hay datos';
  @Input() description?: string;
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  
  @Output() onAction = new EventEmitter<void>();
}