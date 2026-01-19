import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  title = 'menugr-pro';

  constructor(
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private translate: TranslateService
  ) {
    // Configurar idioma por defecto
    this.translate.setDefaultLang('es');
    
    // Configurar spinner
    this.spinner.show();
    
    // Simular carga inicial
    setTimeout(() => {
      this.spinner.hide();
    }, 1000);
  }
}