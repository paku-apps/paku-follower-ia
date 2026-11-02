import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ReviewsService, ReviewItem } from '../../core/services/reviews.service';
import { AiService } from '../../core/services/ai.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { AppsService, AppSummary } from '../../core/services/apps.service';
import { MyAppsService } from '../../core/services/my-apps.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <h3 style="margin: 0">Reviews</h3>
          <select [ngModel]="selectedAppIdSig()" (ngModelChange)="onAppChange($event)" style="background:var(--surface-2);color:var(--text);border:1px solid rgba(255,255,255,.1);padding:6px 8px;border-radius:8px">
            <option value="">Seleccionar app</option>
            <option *ngFor="let a of apps()" [value]="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div>
            <label style="opacity:.8;font-size:12px">Periodo</label>
            <select [ngModel]="periodSig()" (ngModelChange)="setPeriod($event)" style="background:var(--surface-2);color:var(--text);border:1px solid rgba(255,255,255,.1);padding:6px 8px;border-radius:8px">
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="year">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <div *ngIf="periodSig() === 'custom'" style="display:flex;align-items:center;gap:8px">
            <input type="date" [ngModel]="customStartSig()" (ngModelChange)="customStartSig.set($event)" />
            <span>-</span>
            <input type="date" [ngModel]="customEndSig()" (ngModelChange)="customEndSig.set($event)" />
          </div>
          <div>
            <label style="opacity:.8;font-size:12px">Rating</label>
            <div style="display:flex;gap:8px">
              <label><input type="checkbox" [checked]="hasRating(5)" (change)="toggleRating(5,$event.target.checked)"/> 5★</label>
              <label><input type="checkbox" [checked]="hasRating(4)" (change)="toggleRating(4,$event.target.checked)"/> 4★</label>
              <label><input type="checkbox" [checked]="hasRating(3)" (change)="toggleRating(3,$event.target.checked)"/> 3★</label>
              <label><input type="checkbox" [checked]="hasRating(2)" (change)="toggleRating(2,$event.target.checked)"/> 2★</label>
              <label><input type="checkbox" [checked]="hasRating(1)" (change)="toggleRating(1,$event.target.checked)"/> 1★</label>
            </div>
          </div>
          <div>
            <label style="opacity:.8;font-size:12px">Orden</label>
            <select [ngModel]="sortSig()" (ngModelChange)="sortSig.set($event)" style="background:var(--surface-2);color:var(--text);border:1px solid rgba(255,255,255,.1);padding:6px 8px;border-radius:8px">
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
            </select>
          </div>
        </div>
      </div>
      <div class="grid">
        <div class="card" *ngFor="let r of shownReviews()">
          <div style="display: flex; justify-content: space-between">
            <div>
              <div style="font-weight: 600">{{ selectedAppName() }}</div>
              <div style="opacity: 0.7; font-size: 12px">{{ r.user }} · ★ {{ r.rating }}</div>
            </div>
            <button (click)="autoResponder(r.id)" [disabled]="!!r.reply" style="background: var(--primary); color: white; border: 0; padding: 6px 10px; border-radius: 8px;opacity:{{r.reply?0.6:1}}">
              Auto-responder IA
            </button>
          </div>
          <div style="margin-top: 8px">{{ r.content }}</div>
          <div *ngIf="r.reply" style="margin-top: 10px; padding: 10px; border-radius: 8px; background: rgba(20, 184, 166, 0.12)">
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
  private myApps = inject(MyAppsService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  private state = signal<ReviewItem[]>([]);
  readonly apps = computed<AppSummary[]>(() => {
    return this.myApps.favoritesDetailsSig().map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      rating: a.rating,
      downloads: a.downloads,
      iconUrl: a.iconUrl ?? '',
      developer: a.developer ?? ''
    }));
  });
  readonly selectedAppIdSig = signal<string>('');
  private cursor = signal<string | undefined>(undefined);

  constructor() {
    const u = this.auth.userSig();
    if (u?.id) {
      this.myApps.fetchMine(u.id).subscribe(() => {
        const list = this.apps();
        const qId = this.route.snapshot.queryParamMap.get('appId') || '';
        const chosen = qId && list.some((x) => x.id === qId) ? qId : (list[0]?.id || '');
        if (chosen) {
          this.selectedAppIdSig.set(chosen);
          this.loadFirstPage();
        }
      });
    }
  }

  readonly reviews = computed(() => this.state());
  readonly selectedAppName = computed(() => {
    const id = this.selectedAppIdSig();
    const app = this.apps().find((a) => a.id === id);
    return app?.name ?? '';
  });
  readonly periodSig = signal<'7'|'30'|'90'|'year'|'custom'>('90');
  readonly customStartSig = signal<string>('');
  readonly customEndSig = signal<string>('');
  readonly sortSig = signal<'newest'|'oldest'>('newest');
  private ratings = signal<Set<number>>(new Set<number>());
  readonly shownReviews = computed(() => {
    const items = this.reviews();
    const period = this.periodSig();
    const range = this.computeRange(period, this.customStartSig(), this.customEndSig());
    const filterRatings = this.ratings();
    const inRange = (sec?: number) => {
      if (!sec || !range) return false;
      const d = new Date(sec * 1000);
      return d >= range.start && d <= range.end;
    };
    const filtered = items.filter((i) => {
      const okDate = inRange(i.lastModUserSeconds);
      const okRating = filterRatings.size === 0 || filterRatings.has(i.rating ?? 0);
      return okDate && okRating;
    });
    const sorted = [...filtered].sort((a, b) => {
      const va = a.lastModUserSeconds ?? 0;
      const vb = b.lastModUserSeconds ?? 0;
      return this.sortSig() === 'newest' ? vb - va : va - vb;
    });
    return sorted;
  });

  autoResponder(id: string) {
    const r = this.state().find((x) => x.id === id);
    if (!r || r.reply) return;
    const appId = this.selectedAppIdSig();
    const app = this.apps().find((a) => a.id === appId);
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
          const list = this.state().map((x) => (x.id === id ? { ...x, reply } : x));
          this.state.set(list);
        },
        error: () => {
          // Sin notificaciones en error para cumplir regla de notificaciones solo por reviews de hoy sin responder
        }
      });
    });
  }

  onAppChange(appId: string) {
    this.selectedAppIdSig.set(appId);
    this.loadFirstPage();
  }

  private loadFirstPage() {
    const appId = this.selectedAppIdSig();
    if (!appId) return;
    this.reviewsSvc.list(appId, undefined, 10).subscribe(({ items, nextCursor }) => {
      this.state.set(items);
      this.cursor.set(nextCursor);
      this.addTodayUnrepliedNotifications(appId, items);
    });
  }

  readonly nextCursor = computed(() => this.cursor());

  loadMore() {
    const appId = this.selectedAppIdSig();
    if (!appId) return;
    const cursor = this.cursor();
    if (!cursor) return;
    this.reviewsSvc.list(appId, cursor, 10).subscribe(({ items, nextCursor }) => {
      this.state.set([...this.state(), ...items]);
      this.cursor.set(nextCursor);
      this.addTodayUnrepliedNotifications(appId, items);
    });
  }

  private addTodayUnrepliedNotifications(appId: string, items: { id: string; user: string; reply?: string; lastModUserSeconds?: number }[]) {
    const today = new Date();
    const isToday = (sec?: number) => {
      if (!sec) return false;
      const d = new Date(sec * 1000);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };
    const app = this.apps().find((a) => a.id === appId);
    items
      .filter((i) => isToday(i.lastModUserSeconds) && !i.reply)
      .forEach((i) => {
        const nid = `n-${appId}-${i.id}`;
        const exists = this.notifications.items().some((n) => n.id === nid);
        if (!exists) {
          this.notifications.add({
            id: nid,
            message: `Nueva review hoy en ${app?.name ?? 'App'} (${i.user})`,
            date: new Date().toISOString()
          });
        }
      });
  }

  setPeriod(val: '7'|'30'|'90'|'year'|'custom') {
    this.periodSig.set(val);
  }
  hasRating(stars: number): boolean {
    return this.ratings().has(stars);
  }
  toggleRating(stars: number, on: boolean) {
    const set = new Set(this.ratings());
    if (on) set.add(stars);
    else set.delete(stars);
    this.ratings.set(set);
  }
  private computeRange(period: '7'|'30'|'90'|'year'|'custom', start?: string, end?: string): { start: Date; end: Date } | null {
    const now = new Date();
    if (period === '7' || period === '30' || period === '90') {
      const days = Number(period);
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - days);
      return { start: startDate, end: now };
    }
    if (period === 'year') {
      const startDate = new Date(now.getFullYear(), 0, 1);
      return { start: startDate, end: now };
    }
    if (period === 'custom') {
      if (!start || !end) return null;
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
      return { start: s, end: e };
    }
    return null;
  }
}
