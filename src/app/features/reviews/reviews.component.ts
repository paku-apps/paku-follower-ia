import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ReviewsService } from '../../core/services/reviews.service';
import { AiService } from '../../core/services/ai.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { AppsService, AppSummary } from '../../core/services/apps.service';

type Review = {
  id: string;
  user: string;
  rating: number;
  content: string;
  replied?: boolean;
  reply?: string;
};

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <h3 style="margin: 0">Reviews</h3>
          <select [(ngModel)]="selectedAppId" (ngModelChange)="onAppChange($event)" style="background:var(--surface-2);color:var(--text);border:1px solid rgba(255,255,255,.1);padding:6px 8px;border-radius:8px">
            <option [ngValue]="null">Seleccionar app</option>
            <option *ngFor="let a of apps()" [ngValue]="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div>
          <button (click)="simulateNew()" style="background: var(--accent); color: white; border: 0; padding: 6px 10px; border-radius: 8px">
            Simular nuevo comentario
          </button>
        </div>
      </div>
      <div class="grid">
        <div class="card" *ngFor="let r of reviews()">
          <div style="display: flex; justify-content: space-between">
            <div>
              <div style="font-weight: 600">{{ selectedAppName() }}</div>
              <div style="opacity: 0.7; font-size: 12px">{{ r.user }} · ★ {{ r.rating }}</div>
            </div>
            <button (click)="autoResponder(r.id)" [disabled]="r.replied" style="background: var(--primary); color: white; border: 0; padding: 6px 10px; border-radius: 8px;opacity:{{r.replied?0.6:1}}">
              Auto-responder IA
            </button>
          </div>
          <div style="margin-top: 8px">{{ r.content }}</div>
          <div *ngIf="r.replied" style="margin-top: 10px; padding: 10px; border-radius: 8px; background: rgba(20, 184, 166, 0.12)">
            <div style="font-size: 12px; opacity: 0.8">Respuesta enviada</div>
            <div>{{ r.reply }}</div>
          </div>
        </div>
      </div>
      <div *ngIf="nextCursor()" style="margin-top:12px;display:flex;justify-content:center">
        <button (click)="loadMore()" style="background: var(--surface); color: var(--text); border: 1px solid rgba(255,255,255,.1); padding: 8px 12px; border-radius: 8px">
          Cargar más
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewsComponent {
  private reviewsSvc = inject(ReviewsService);
  private ai = inject(AiService);
  private notifications = inject(NotificationsService);
  private appsSvc = inject(AppsService);

  private state = signal<Review[]>([]);
  readonly apps = signal<AppSummary[]>([]);
  selectedAppId: string | null = null;
  private cursor = signal<string | undefined>(undefined);

  constructor() {
    this.appsSvc.listAll().subscribe((apps) => {
      this.apps.set(apps);
      if (apps.length > 0) {
        this.selectedAppId = apps[0].id;
        this.loadFirstPage();
      }
    });
  }

  readonly reviews = computed(() => this.state());
  readonly selectedAppName = computed(() => {
    const id = this.selectedAppId;
    const app = this.apps().find((a) => a.id === id);
    return app?.name ?? '';
  });

  autoResponder(id: string) {
    const r = this.state().find((x) => x.id === id);
    if (!r || r.replied) return;
    const app = this.apps().find((a) => a.id === this.selectedAppId);
    if (!app) return;
    this.ai.generateReply({
      appName: app.name,
      user: r.user,
      rating: r.rating,
      content: r.content,
      tone: 'friendly'
    }).subscribe((reply) => {
      this.reviewsSvc.reply(app.id, id, reply).subscribe({
        next: () => {
          const list = this.state().map((x) => (x.id === id ? { ...x, replied: true, reply } : x));
          this.state.set(list);
          this.notifications.add({
            id: `n-${Date.now()}`,
            message: `Auto-respuesta enviada en ${app.name} (${r.user})`,
            date: new Date().toISOString()
          });
        },
        error: () => {
          this.notifications.add({
            id: `n-${Date.now()}`,
            message: `Error al guardar respuesta en ${app.name} (${r.user})`,
            date: new Date().toISOString()
          });
        }
      });
    });
  }

  simulateNew() {
    const app = this.apps()[0];
    if (!app) return;
    this.state.set([{ id: `tmp-${Date.now()}`, user: 'Nuevo Usuario', rating: 4, content: 'Muy útil, gracias.' }, ...this.state()]);
    this.notifications.add({
      id: `n-${Date.now()}`,
      message: `Nueva review en ${app.name} (Nuevo Usuario)`,
      date: new Date().toISOString()
    });
  }

  onAppChange(appId: string | null) {
    this.selectedAppId = appId;
    this.loadFirstPage();
  }

  private loadFirstPage() {
    if (!this.selectedAppId) return;
    this.reviewsSvc.list(this.selectedAppId, undefined, 10).subscribe(({ items, nextCursor }) => {
      const mapped = items.map((i) => ({
        id: i.id,
        user: i.user,
        rating: i.rating,
        content: i.content,
        replied: !!i.reply,
        reply: i.reply
      }));
      this.state.set(mapped);
      this.cursor.set(nextCursor);
    });
  }

  readonly nextCursor = computed(() => this.cursor());

  loadMore() {
    if (!this.selectedAppId) return;
    const cursor = this.cursor();
    if (!cursor) return;
    this.reviewsSvc.list(this.selectedAppId, cursor, 10).subscribe(({ items, nextCursor }) => {
      const mapped = items.map((i) => ({
        id: i.id,
        user: i.user,
        rating: i.rating,
        content: i.content,
        replied: !!i.reply,
        reply: i.reply
      }));
      this.state.set([...this.state(), ...mapped]);
      this.cursor.set(nextCursor);
    });
  }
}
