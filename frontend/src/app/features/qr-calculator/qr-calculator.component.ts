import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { QrService } from '../../core/services/qr.service';
import { QrResponse } from '../../core/models/qr-response.model';
import { MatrixInputComponent } from './components/matrix-input/matrix-input.component';
import { MatrixViewComponent } from './components/matrix-view/matrix-view.component';
import { StatsViewComponent } from './components/stats-view/stats-view.component';

@Component({
  selector: 'app-qr-calculator',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatrixInputComponent,
    MatrixViewComponent,
    StatsViewComponent,
  ],
  templateUrl: './qr-calculator.component.html',
  styleUrl: './qr-calculator.component.scss',
})
export class QrCalculatorComponent {
  protected readonly authService = inject(AuthService);
  private readonly qrService = inject(QrService);

  readonly apiKeyVisible = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<QrResponse | null>(null);

  private matrix: number[][] = [];

  onApiKeyChange(value: string): void {
    this.authService.setApiKey(value);
  }

  toggleApiKeyVisibility(): void {
    this.apiKeyVisible.update((visible) => !visible);
  }

  onMatrixChange(matrix: number[][]): void {
    this.matrix = matrix;
  }

  /** Limpia también el resultado y el error del cálculo anterior, no solo la matriz. */
  clearResults(): void {
    this.result.set(null);
    this.errorMessage.set(null);
  }

  calculate(): void {
    if (!this.authService.apiKey()) {
      this.errorMessage.set('Ingresá tu API key antes de calcular.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    this.qrService.computeQr(this.matrix).subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const backendMessage = (err.error as { error?: string } | null)?.error;
      if (backendMessage) return backendMessage;
      if (err.status === 0) return 'No se pudo conectar con go-qr-api. ¿Está corriendo?';
      return `Error inesperado (HTTP ${err.status}).`;
    }
    if (err instanceof Error) return err.message;
    return 'Ocurrió un error inesperado.';
  }
}
