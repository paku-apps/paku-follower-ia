import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgFor, DecimalPipe } from '@angular/common';

type Metric = { label: string; value: number; suffix?: string };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, DecimalPipe],
  template: `
    <div class="grid cols-3">
      <div class="card metric" *ngFor="let m of metrics()">
        <div class="label">{{ m.label }}</div>
        <div class="value">{{ m.value | number }}{{ m.suffix || '' }}</div>
      </div>
    </div>
    <div style="height: 16px"></div>
    <div class="grid cols-2">
      <div class="card">
        <h3 style="margin: 0 0 8px 0">Tendencia de Reviews</h3>
        <div style="opacity: 0.7">Gráfico pendiente de integrar</div>
      </div>
      <div class="card">
        <h3 style="margin: 0 0 8px 0">Alertas</h3>
        <div style="opacity: 0.7">Sin notificaciones nuevas</div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private data = signal<Metric[]>([
    { label: 'Nuevas reviews (24h)', value: 32 },
    { label: 'Auto-respuestas', value: 18 },
    { label: 'Rating promedio', value: 4.4, suffix: '★' }
  ]);

  readonly metrics = computed(() => this.data());
}
