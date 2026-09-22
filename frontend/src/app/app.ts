import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

import { QrCalculatorComponent } from './features/qr-calculator/qr-calculator.component';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, QrCalculatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
