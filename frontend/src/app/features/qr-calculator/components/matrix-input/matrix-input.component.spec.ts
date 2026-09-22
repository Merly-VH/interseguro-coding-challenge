import { TestBed } from '@angular/core/testing';

import { MatrixInputComponent } from './matrix-input.component';

describe('MatrixInputComponent', () => {
  function create() {
    const fixture = TestBed.createComponent(MatrixInputComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MatrixInputComponent] });
  });

  it('empieza con una grilla 3x3 de ceros', () => {
    const fixture = create();
    expect(fixture.componentInstance.cells()).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
  });

  it('actualiza una celda sin afectar las demás', () => {
    const fixture = create();
    fixture.componentInstance.onCellChange(1, 2, '5.5');

    const cells = fixture.componentInstance.cells();
    expect(cells[1][2]).toBe(5.5);
    expect(cells[0][0]).toBe(0);
  });

  it('preserva los valores existentes al agrandar la matriz', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.onCellChange(0, 0, '9');
    c.onCellChange(2, 2, '7');

    c.onRowsChange(5);
    c.onColsChange(5);

    const cells = c.cells();
    expect(cells.length).toBe(5);
    expect(cells[0].length).toBe(5);
    expect(cells[0][0]).toBe(9);
    expect(cells[2][2]).toBe(7);
    expect(cells[4][4]).toBe(0);
  });

  it('descarta los valores fuera de rango al achicar la matriz', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.onCellChange(2, 2, '7');

    c.onRowsChange(2);
    c.onColsChange(2);

    const cells = c.cells();
    expect(cells.length).toBe(2);
    expect(cells[0].length).toBe(2);
  });

  it('limita el tamaño al rango permitido (1-8)', () => {
    const fixture = create();
    const c = fixture.componentInstance;

    c.onRowsChange(20);
    expect(c.rows()).toBe(8);

    c.onRowsChange(0);
    expect(c.rows()).toBe(1);
  });

  it('trata un valor no numérico de celda como 0', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.onCellChange(0, 0, 'no-es-un-numero');
    expect(c.cells()[0][0]).toBe(0);
  });

  it('clear() vuelve todas las celdas a 0 sin cambiar el tamaño', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.onRowsChange(4);
    c.onColsChange(2);
    c.onCellChange(0, 0, '9');
    c.onCellChange(3, 1, '7');

    c.clear();

    expect(c.cells()).toEqual([
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ]);
  });

  it('clear() emite la matriz vacía', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.onCellChange(0, 0, '9');

    const emitted: number[][][] = [];
    c.matrixChange.subscribe((m) => emitted.push(m));
    c.clear();

    expect(emitted).toEqual([
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    ]);
  });
});
