import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
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