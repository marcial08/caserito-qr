// image-upload.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-upload-container">
      <!-- Upload Area -->
      <div class="upload-area" (click)="fileInput.click()">
        <input
          type="file"
          #fileInput
          (change)="onFileSelected($event)"
          multiple
          [accept]="acceptTypes"
          style="display: none"
        />
        <div class="upload-content">
          <i class="fa fa-cloud-upload-alt fa-2x text-muted mb-3"></i>
          <p class="upload-text">Arrastra imágenes o haz clic para subir</p>
          <p class="upload-subtext">
            {{ acceptTypes }} (Máx. {{ maxFileSize }}MB cada una)
            @if (maxFiles) {
              <br>
              <small>Máximo {{ maxFiles }} imágenes</small>
            }
          </p>
        </div>
      </div>

      <!-- Image Previews -->
      @if (currentImages && currentImages.length > 0) {
        <div class="image-preview-grid mt-3">
          @for (image of currentImages; track image.id; let i = $index) {
            <div class="image-preview-item" [class.primary]="image.is_primary">
              <img [src]="image.url" [alt]="image.alt_text || 'Imagen'" class="preview-image" />
              <div class="preview-overlay">
                @if (!image.is_primary) {
                  <button type="button" class="btn-action" (click)="setAsPrimary(i)" title="Establecer como principal">
                    <i class="fa fa-star"></i>
                  </button>
                }
                <button type="button" class="btn-action" (click)="removeImage(i)" title="Eliminar imagen">
                  <i class="fa fa-trash text-danger"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .image-upload-container {
      .upload-area {
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        background: #f8f9fa;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: #2A9D8F;
          background: rgba(42, 157, 143, 0.05);
        }
      }
      
      .upload-content {
        .upload-text {
          font-weight: 500;
          color: #495057;
          margin-bottom: 0.25rem;
        }
        
        .upload-subtext {
          font-size: 0.875rem;
          color: #6c757d;
        }
      }
      
      .image-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
      }
      
      .image-preview-item {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 1;
        border: 2px solid transparent;
        
        &.primary {
          border-color: #2A9D8F;
        }
        
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s ease;
          
          &:hover {
            opacity: 1;
          }
        }
        
        .btn-action {
          background: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
          
          &:hover {
            transform: scale(1.1);
          }
          
          .fa-star {
            color: #ffc107;
          }
        }
      }
    }
  `]
})
export class ImageUploadComponent {
  @Input() currentImages: any[] = [];
  @Input() maxFiles?: number;
  @Input() maxFileSize: number = 5;
  @Input() acceptTypes: string = 'image/*';
  
  @Output() imagesUploaded = new EventEmitter<File[]>();
  @Output() imageRemoved = new EventEmitter<number>();
  @Output() mainImageChanged = new EventEmitter<number>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Check max files limit
      if (this.maxFiles && (this.currentImages.length + files.length) > this.maxFiles) {
        alert(`Solo puedes subir un máximo de ${this.maxFiles} imágenes`);
        return;
      }
      
      // Check file size
      const oversizedFiles = files.filter(file => file.size > this.maxFileSize * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert(`Algunos archivos superan el tamaño máximo de ${this.maxFileSize}MB`);
        return;
      }
      
      this.imagesUploaded.emit(files);
      input.value = ''; // Reset input
    }
  }

  setAsPrimary(index: number): void {
    this.mainImageChanged.emit(index);
  }

  removeImage(index: number): void {
    this.imageRemoved.emit(index);
  }
}