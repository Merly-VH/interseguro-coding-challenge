import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { Stats } from '../../../../core/models/qr-response.model';

@Component({
  selector: 'app-stats-view',
  imports: [DecimalPipe, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './stats-view.component.html',
  styleUrl: './stats-view.component.scss',
})
export class StatsViewComponent {
  readonly stats = input<Stats | null>(null);
}
