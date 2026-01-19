import { Component, Input, Output, EventEmitter } from '@angular/core';
import { QRCodeModule } from 'ngx-qrcode';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [QRCodeModule],
  template: `
    <div class="qr-generator">
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Nombre del QR</label>
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="qrName"
              placeholder="Ej: Mesa 1, Entrada principal"
              (input)="onConfigChange()">
          </div>
          
          <div class="mb-3">
            <label class="form-label">Color del QR</label>
            <input 
              type="color" 
              class="form-control form-control-color" 
              [(ngModel)]="qrColor"
              (change)="onConfigChange()">
          </div>
          
          <div class="form-check mb-3">
            <input 
              class="form-check-input" 
              type="checkbox" 
              [(ngModel)]="includeLogo"
              (change)="onConfigChange()"
              id="includeLogo">
            <label class="form-check-label" for="includeLogo">
              Incluir logo del negocio
            </label>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="qr-preview text-center p-4 border rounded">
            <qrcode 
              [qrdata]="qrData" 
              [width]="200" 
              [colorDark]="qrColor"
              [colorLight]="'#ffffff'">
            </qrcode>
            
            <div class="mt-3">
              <small class="text-muted">Escanea para ver el menú</small>
              <div class="mt-2">
                <a [href]="qrData" target="_blank" class="btn btn-sm btn-outline-primary">
                  <i class="fa fa-external-link me-1"></i>
                  Ver enlace
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4">
        <button class="btn btn-primary me-2" (click)="onDownload('png')">
          <i class="fa fa-download me-1"></i>
          PNG
        </button>
        <button class="btn btn-outline-primary me-2" (click)="onDownload('svg')">
          <i class="fa fa-download me-1"></i>
          SVG
        </button>
        <button class="btn btn-outline-secondary" (click)="onDownload('pdf')">
          <i class="fa fa-download me-1"></i>
          PDF
        </button>
      </div>
    </div>
  `,
  styles: [`
    .qr-preview {
      background: white;
    }
  `]
})
export class QrGeneratorComponent {
  @Input() businessSlug: string = '';
  @Output() configChange = new EventEmitter<any>();
  @Output() download = new EventEmitter<string>();
  
  qrName: string = 'Mi QR';
  qrColor: string = '#2A9D8F';
  includeLogo: boolean = true;
  
  get qrData(): string {
    return `https://menugr.pro/m/${this.businessSlug}`;
  }
  
  onConfigChange(): void {
    this.configChange.emit({
      name: this.qrName,
      color: this.qrColor,
      includeLogo: this.includeLogo
    });
  }
  
  onDownload(format: string): void {
    this.download.emit(format);
  }
}