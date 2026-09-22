import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-matrix-view',
  imports: [DecimalPipe, MatCardModule],
  templateUrl: './matrix-view.component.html',
  styleUrl: './matrix-view.component.scss',
})
export class MatrixViewComponent {
  readonly label = input.required<string>();
  readonly matrix = input<number[][] | null>(null);
}
