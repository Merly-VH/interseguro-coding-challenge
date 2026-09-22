import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const MIN_SIZE = 1;
const MAX_SIZE = 8; // límite de usabilidad para editar a mano, no del backend (que soporta hasta 1000x1000)
const DEFAULT_SIZE = 3;

// MatrixInputComponent es un editor de matriz rectangular: controla su
// propia grilla de celdas y emite la matriz completa cada vez que cambia
// (tamaño o valor de celda), para que el padre no tenga que sincronizar
// filas/columnas manualmente.
@Component({
  selector: 'app-matrix-input',
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './matrix-input.component.html',
  styleUrl: './matrix-input.component.scss',
})
export class MatrixInputComponent {
  readonly matrixChange = output<number[][]>();

  readonly minSize = MIN_SIZE;
  readonly maxSize = MAX_SIZE;

  readonly rows = signal(DEFAULT_SIZE);
  readonly cols = signal(DEFAULT_SIZE);
  readonly cells = signal<number[][]>(this.buildGrid(DEFAULT_SIZE, DEFAULT_SIZE));

  constructor() {
    this.emitCurrent();
  }

  onRowsChange(value: number): void {
    const rows = this.clampSize(value);
    this.rows.set(rows);
    this.resize(rows, this.cols());
  }

  onColsChange(value: number): void {
    const cols = this.clampSize(value);
    this.cols.set(cols);
    this.resize(this.rows(), cols);
  }

  onCellChange(i: number, j: number, raw: string): void {
    const value = Number(raw);
    const next = this.cells().map((row) => [...row]);
    next[i][j] = Number.isFinite(value) ? value : 0;
    this.cells.set(next);
    this.emitCurrent();
  }

  /** Vuelve todas las celdas a 0, manteniendo el tamaño actual de la matriz. */
  clear(): void {
    this.cells.set(this.buildGrid(this.rows(), this.cols()));
    this.emitCurrent();
  }

  private resize(rows: number, cols: number): void {
    const previous = this.cells();
    const next = this.buildGrid(rows, cols);
    for (let i = 0; i < rows && i < previous.length; i++) {
      for (let j = 0; j < cols && j < previous[i].length; j++) {
        next[i][j] = previous[i][j];
      }
    }
    this.cells.set(next);
    this.emitCurrent();
  }

  private clampSize(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_SIZE;
    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.trunc(value)));
  }

  private buildGrid(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  }

  private emitCurrent(): void {
    this.matrixChange.emit(this.cells());
  }
}
