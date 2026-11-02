import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { NgFor, DecimalPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyAppsService } from '../../core/services/my-apps.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

type AppMetric = {
  id: string;
  name: string;
  todayUnreplied: number;
  rating: number;
  downloads: number;
  
  ratingDist: number[];
  ratingMax: number;
  dailyCounts: number[];
  dailyMax: number;
  periodTotal: number;
  periodAvgRating: number;
  periodResponseRate: number;
};
type Stats = { todayTotal: number; todayUnreplied: number; todayResponded: number };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, DecimalPipe, NgIf, FormsModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div>
        <label style="opacity:.8;font-size:12px">App</label>
        <select [ngModel]="selectedAppIdSig()" (ngModelChange)="selectedAppIdSig.set($event)" style="background:var(--surface-2);color:var(--text);border:1px solid rgba(255,255,255,.1);padding:6px 8px;border-radius:8px;min-width:220px">
          <option value="">Todas mis apps</option>
          <option *ngFor="let a of apps()" [value]="a.id">{{ a.name }}</option>
        </select>
      </div>
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
    </div>
    <div class="grid cols-3" style="margin-bottom:16px">
      <div class="card metric">
        <div class="label">Reviews (periodo)</div>
        <div class="value">{{ summary().totalTodayReviews | number }}</div>
      </div>
      <div class="card metric">
        <div class="label">Sin responder (periodo)</div>
        <div class="value">{{ summary().totalTodayUnreplied | number }}</div>
      </div>
      <div class="card metric">
        <div class="label">Tasa respuesta (periodo)</div>
        <div class="value">{{ summary().responseRate | number }}%</div>
      </div>
      <div class="card metric">
        <div class="label">Rating promedio</div>
        <div class="value">{{ summary().avgRating | number }}★</div>
      </div>
      <div class="card metric">
        <div class="label">Descargas totales</div>
        <div class="value">{{ summary().totalDownloads | number }}</div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin: 0 0 12px 0">Mis Apps · Resumen de hoy</h3>
      <div class="grid cols-3">
        <div class="card" *ngFor="let m of appMetrics()">
          <div style="font-weight:600">{{ m.name }}</div>
          <div style="opacity:.8;font-size:12px">{{ m.downloads | number }} descargas · ★ {{ m.rating }}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <span style="background:rgba(255,255,255,.08);padding:4px 8px;border-radius:999px;font-size:12px">Reviews: {{ m.periodTotal | number }}</span>
            <span style="background:rgba(255,255,255,.08);padding:4px 8px;border-radius:999px;font-size:12px">Sin responder: {{ m.todayUnreplied | number }}</span>
            <span style="background:rgba(255,255,255,.08);padding:4px 8px;border-radius:999px;font-size:12px">Tasa resp: {{ m.periodResponseRate | number }}%</span>
            <span style="background:rgba(255,255,255,.08);padding:4px 8px;border-radius:999px;font-size:12px">Promedio: {{ m.periodAvgRating | number }}★</span>
          </div>
          <div style="margin-top:8px">
            <button (click)="goToReviews(m.id)" style="background: var(--surface); color: var(--text); border: 1px solid rgba(255,255,255,.1); padding: 6px 10px; border-radius: 8px">
              Ver reviews
            </button>
          </div>
          <div style="margin-top:12px">
            <div style="font-size:12px;opacity:.8;margin-bottom:6px">Distribución ratings (periodo)</div>
            <div *ngFor="let stars of [5,4,3,2,1]" style="display:flex;align-items:center;gap:8px;margin:2px 0">
              <span style="width:24px;text-align:right">{{ stars }}★</span>
              <div style="flex:1;background:rgba(255,255,255,.08);height:10px;border-radius:6px;overflow:hidden">
                <div [style.width.%]="percent(m.ratingDist[5-stars], m.ratingMax)" style="background:var(--accent);height:10px"></div>
              </div>
              <span style="width:30px;text-align:right">{{ m.ratingDist[5-stars] | number }}</span>
            </div>
          </div>
          <div style="margin-top:12px">
            <div style="font-size:12px;opacity:.8;margin-bottom:6px">Reviews por día (periodo)</div>
            <div [style.display]="'grid'" [style.gridTemplateColumns]="'repeat(' + m.dailyCounts.length + ',1fr)'" style="align-items:end;gap:2px;height:48px;overflow:hidden">
              <div *ngFor="let c of m.dailyCounts" [style.height.%]="percent(c, m.dailyMax)" style="width:100%;background:var(--primary);border-radius:2px"></div>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="appMetrics().length === 0" style="opacity:.8">No hay apps favoritas seleccionadas.</div>
    </div>
    <div style="height: 16px"></div>
    <div class="grid cols-2">
      <div class="card">
        <h3 style="margin: 0 0 8px 0">Top pendientes hoy</h3>
        <div *ngFor="let t of topUnreplied()">
          <div style="display:flex;justify-content:space-between">
            <span>{{ t.name }}</span>
            <span style="font-weight:600">{{ t.count }}</span>
          </div>
        </div>
        <div *ngIf="topUnreplied().length === 0" style="opacity:.8">Sin pendientes hoy.</div>
      </div>
      <div class="card">
        <h3 style="margin: 0 0 8px 0">Resumen por categoría</h3>
        <div *ngFor="let c of categories()">
          <div style="display:flex;justify-content:space-between">
            <span>{{ c.category }}</span>
            <span style="font-weight:600">{{ c.count }}</span>
          </div>
        </div>
        <div *ngIf="categories().length === 0" style="opacity:.8">Sin categorías.</div>
      </div>
    </div>
    <div style="height: 16px"></div>
    <div class="grid cols-2">
      <div class="card">
        <h3 style="margin: 0 0 8px 0">Ranking por reviews (periodo)</h3>
        <div *ngFor="let r of rankingApps()">
          <div style="display:flex;justify-content:space-between">
            <span>{{ r.name }}</span>
            <span style="font-weight:600">{{ r.count }}</span>
          </div>
        </div>
        <div *ngIf="rankingApps().length === 0" style="opacity:.8">Sin datos en el periodo.</div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private myApps = inject(MyAppsService);
  private reviews = inject(ReviewsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private data = signal<AppMetric[]>([]);
  private appStats = signal<Record<string, Stats>>({});
  readonly selectedAppIdSig = signal<string>('');
  readonly periodSig = signal<'7'|'30'|'90'|'year'|'custom'>('90');
  readonly customStartSig = signal<string>('');
  readonly customEndSig = signal<string>('');
  readonly apps = computed(() => this.myApps.favoritesDetailsSig().map(a => ({ id: a.id, name: a.name })));

  readonly appMetrics = computed(() => {
    const sel = this.selectedAppIdSig();
    const items = this.data();
    return sel ? items.filter((m) => m.id === sel) : items;
  });
  readonly summary = computed(() => {
    const favs = this.myApps.favoritesDetailsSig();
    const sel = this.selectedAppIdSig();
    const idsToInclude = sel ? [sel] : favs.map((f) => f.id);
    const stats = Object.entries(this.appStats())
      .filter(([id]) => idsToInclude.includes(id))
      .map(([, s]) => s);
    const favsIncluded = favs.filter((f) => idsToInclude.includes(f.id));
    const totalTodayReviews = stats.reduce((a, s) => a + s.todayTotal, 0);
    const totalTodayUnreplied = stats.reduce((a, s) => a + s.todayUnreplied, 0);
    const totalTodayResponded = stats.reduce((a, s) => a + s.todayResponded, 0);
    const responseRate = totalTodayReviews > 0 ? Math.round((totalTodayResponded / totalTodayReviews) * 100) : 0;
    const avgRating = favsIncluded.length > 0 ? Number((favsIncluded.reduce((a, f) => a + (f.rating || 0), 0) / favsIncluded.length).toFixed(2)) : 0;
    const totalDownloads = favsIncluded.reduce((a, f) => a + (f.downloads || 0), 0);
    return { totalTodayReviews, totalTodayUnreplied, responseRate, avgRating, totalDownloads };
  });
  readonly topUnreplied = computed(() => {
    const favs = this.myApps.favoritesDetailsSig();
    const sel = this.selectedAppIdSig();
    const idsToInclude = sel ? [sel] : favs.map((f) => f.id);
    const list = Object.entries(this.appStats())
      .filter(([id]) => idsToInclude.includes(id))
      .map(([id, s]) => ({
        id,
        name: favs.find((f) => f.id === id)?.name || id,
        count: s.todayUnreplied
      }));
    return list.sort((a, b) => b.count - a.count).slice(0, 5);
  });
  readonly categories = computed(() => {
    const favsAll = this.myApps.favoritesDetailsSig();
    const sel = this.selectedAppIdSig();
    const favs = sel ? favsAll.filter((f) => f.id === sel) : favsAll;
    const counter: Record<string, number> = {};
    favs.forEach((f) => {
      const cat = f.category || 'Sin categoría';
      counter[cat] = (counter[cat] || 0) + 1;
    });
    return Object.entries(counter).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  });
  readonly rankingApps = computed(() => {
    const favs = this.myApps.favoritesDetailsSig();
    const sel = this.selectedAppIdSig();
    const idsToInclude = sel ? [sel] : favs.map((f) => f.id);
    const list = Object.entries(this.appStats())
      .filter(([id]) => idsToInclude.includes(id))
      .map(([id, s]) => ({
        name: favs.find((f) => f.id === id)?.name || id,
        count: s.todayTotal
      }));
    return list.sort((a, b) => b.count - a.count).slice(0, 5);
  });

  constructor() {
    const u = this.auth.userSig();
    if (u?.id) {
      this.myApps.fetchMine(u.id).subscribe(() => {
        this.refresh();
      });
    }
    effect(() => {
      const ids = this.myApps.favoritesSig();
      if (ids.length === 0) {
        this.data.set([]);
        this.appStats.set({});
      } else {
        this.refresh();
      }
    });
    effect(() => {
      this.periodSig();
      this.customStartSig();
      this.customEndSig();
      this.refresh();
    });
  }

  private refresh() {
    const favorites = this.myApps.favoritesDetailsSig();
    const today = new Date();
    const isToday = (sec?: number) => {
      if (!sec) return false;
      const d = new Date(sec * 1000);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };
    favorites.forEach((a) => {
      this.fetchAppStats(a.id, a.name, a.rating, a.downloads);
    });
  }

  private fetchAppStats(appId: string, name: string, rating: number, downloads: number) {
    const now = new Date();
    const range = this.computeRange(this.periodSig(), this.customStartSig(), this.customEndSig()) ?? { start: new Date(now.getFullYear(), 0, 1), end: now };
    const daysRange = Math.max(1, Math.floor((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const barsLen = Math.min(daysRange, 90);
    const ratingDist = [0, 0, 0, 0, 0];
    const dailyCounts = new Array(barsLen).fill(0);
    const collect: { lastModUserSeconds?: number; rating?: number; reply?: string; user?: string; id: string }[] = [];
    const handleItems = (items: { lastModUserSeconds?: number; rating?: number; reply?: string; user?: string; id: string }[]) => {
      collect.push(...items);
    };
    const finalize = () => {
      collect.forEach((i) => {
        const sec = i.lastModUserSeconds ?? 0;
        const d = new Date(sec * 1000);
        if (d >= range.start && d <= range.end) {
          const r = i.rating ?? 0;
          if (r >= 1 && r <= 5) ratingDist[r - 1] += 1;
        }
        if (d >= range.start && d <= range.end) {
          const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          const idx = barsLen - 1 - diff;
          if (idx >= 0 && idx < barsLen) dailyCounts[idx] += 1;
        }
      });
      const ratingMax = Math.max(...ratingDist, 1);
      const dailyMax = Math.max(...dailyCounts, 1);
      const todayTotal = collect.filter((i) => {
        const d = new Date((i.lastModUserSeconds ?? 0) * 1000);
        return d >= range.start && d <= range.end;
      }).length;
      const todayUnreplied = collect.filter((i) => {
        const d = new Date((i.lastModUserSeconds ?? 0) * 1000);
        return d >= range.start && d <= range.end && !i.reply;
      }).length;
      const todayResponded = collect.filter((i) => {
        const d = new Date((i.lastModUserSeconds ?? 0) * 1000);
        return d >= range.start && d <= range.end && !!i.reply;
      }).length;
      const periodTotal = todayTotal;
      const periodRatingSum = ratingDist.reduce((acc, c, idx) => acc + c * (idx + 1), 0);
      const periodAvgRating = periodTotal > 0 ? Number((periodRatingSum / periodTotal).toFixed(2)) : 0;
      const periodResponseRate = periodTotal > 0 ? Math.round((todayResponded / periodTotal) * 100) : 0;
      const existingData = this.data().filter((m) => m.id !== appId);
      this.data.set([...existingData, { id: appId, name, todayUnreplied, rating, downloads, ratingDist, ratingMax, dailyCounts, dailyMax, periodTotal, periodAvgRating, periodResponseRate }]);
      const map = { ...this.appStats() };
      map[appId] = { todayTotal, todayUnreplied, todayResponded };
      this.appStats.set(map);
    };
    const loadPage = (cursor?: string, pagesLeft = 3) => {
      this.reviews.list(appId, cursor, 50).subscribe(({ items, nextCursor }) => {
        handleItems(items);
        if (nextCursor && pagesLeft > 1) {
          loadPage(nextCursor, pagesLeft - 1);
        } else {
          finalize();
        }
      });
    };
    loadPage(undefined, 3);
  }

  percent(value: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.round((value / max) * 100);
  }

  setPeriod(val: '7'|'30'|'90'|'year'|'custom') {
    this.periodSig.set(val);
  }
  private computeRange(period: '7'|'30'|'90'|'year'|'custom', start?: string, end?: string): { start: Date; end: Date } | null {
    const now = new Date();
    if (period === '7' || period === '30' || period === '90') {
      const days = Number(period);
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - days + 1);
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
  goToReviews(appId: string) {
    this.router.navigate(['/reviews'], { queryParams: { appId } });
  }
}
