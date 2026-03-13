import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ReviewsService } from '../../core/services/reviews.service';
import { AiService } from '../../core/services/ai.service';
import { NotificationsService } from '../../core/services/notifications.service';

type Review = {
  id: string;
  appName: string;
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
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="margin: 0">Reviews</h3>
        <button (click)="simulateNew()" style="background: var(--accent); color: white; border: 0; padding: 6px 10px; border-radius: 8px">
          Simular nuevo comentario
        </button>
      </div>
      <div class="grid">
        <div class="card" *ngFor="let r of reviews()">
          <div style="display: flex; justify-content: space-between">
            <div>
              <div style="font-weight: 600">{{ r.appName }}</div>
              <div style="opacity: 0.7; font-size: 12px">{{ r.user }} · ★ {{ r.rating }}</div>
            </div>
            <button (click)="autoResponder(r.id)" style="background: var(--primary); color: white; border: 0; padding: 6px 10px; border-radius: 8px">
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewsComponent {
  private reviewsSvc = inject(ReviewsService);
  private ai = inject(AiService);
  private notifications = inject(NotificationsService);

  private state = signal<Review[]>([]);

  constructor() {
    this.reviewsSvc.list().subscribe((items) => {
      const mapped = items.map((i) => ({
        id: i.id,
        appName: i.appName,
        user: i.user,
        rating: i.rating,
        content: i.content,
        replied: !!i.reply,
        reply: i.reply
      }));
      this.state.set(mapped);
    });
  }

  readonly reviews = computed(() => this.state());

  autoResponder(id: string) {
    const r = this.state().find((x) => x.id === id);
    if (!r) return;
    this.ai.generateReply({ appName: r.appName, user: r.user, rating: r.rating, content: r.content }).subscribe((reply) => {
      this.reviewsSvc.reply(id, reply).subscribe((updated) => {
        if (!updated) return;
        const list = this.state().map((x) => (x.id === id ? { ...x, replied: true, reply } : x));
        this.state.set(list);
        this.notifications.add({
          id: `n-${Date.now()}`,
          message: `Auto-respuesta enviada en ${r.appName} (${r.user})`,
          date: new Date().toISOString()
        });
      });
    });
  }

  simulateNew() {
    const item = {
      appId: '1',
      appName: 'Paku Notes',
      user: 'Nuevo Usuario',
      rating: 4,
      content: 'Muy útil, gracias.'
    };
    this.reviewsSvc.addReview(item).subscribe((r) => {
      this.state.set([{ id: r.id, appName: r.appName, user: r.user, rating: r.rating, content: r.content }, ...this.state()]);
      this.notifications.add({
        id: `n-${Date.now()}`,
        message: `Nueva review en ${r.appName} (${r.user})`,
        date: new Date().toISOString()
      });
    });
  }
}
