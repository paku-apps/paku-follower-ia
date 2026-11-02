import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { NgFor, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AppsService } from '../../core/services/apps.service';
import { MyAppsService } from '../../core/services/my-apps.service';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

type AppItem = {
  id: string;
  name: string;
  category: string;
  rating: number;
  downloads: number;
};

@Component({
  selector: 'app-apps',
  standalone: true,
  imports: [NgFor, DecimalPipe, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="card">
      <h3 style="margin: 0 0 12px 0">
        {{ mine() ? 'Mis Apps' : 'Catálogo de Apps' }}
      </h3>
      <div class="grid cols-3">
        <div class="card" *ngFor="let app of filtered()">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight: 600">{{ app.name }}</div>
            <button mat-icon-button (click)="toggleFav(app.id)" [title]="fav(app.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'">
              <mat-icon [style.color]="fav(app.id) ? 'var(--accent)' : 'var(--muted)'">
                {{ fav(app.id) ? 'star' : 'star_border' }}
              </mat-icon>
            </button>
          </div>
          <div style="opacity: 0.7; font-size: 12px">{{ app.category }}</div>
          <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center">
            <span>★ {{ app.rating }}</span>
            <span style="opacity: 0.7">{{ app.downloads | number }} descargas</span>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppsComponent {
  private route = inject(ActivatedRoute);
  private apps = inject(AppsService);
  private myApps = inject(MyAppsService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  readonly mine = signal<boolean>(false);

  constructor() {
    const mineFlag = this.route.snapshot.data['mine'] === true;
    this.mine.set(mineFlag);
    this.apps.fetchAll();
    const user = this.auth.userSig();
    if (user?.id) {
      this.myApps.fetchMine(user.id).subscribe();
    }
    effect(() => {
      const ids = this.myApps.favoritesSig().filter((id) => !!id && id !== 'undefined' && id !== 'null');
      const all = this.apps.appsSig().map((a) => a.id);
      if (this.mine()) {
        ids.filter((id) => !all.includes(id)).forEach((id) => this.apps.loadOne(id));
      }
    });
  }

  readonly filtered = computed(() => {
    const all = this.apps.appsSig();
    const ids = this.myApps.favoritesSig();
    if (!this.mine()) {
      return all.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        rating: a.rating,
        downloads: a.downloads
      }));
    }
    const inCatalog = all.filter((a) => ids.includes(a.id));
    const fromMine = this.myApps.favoritesDetailsSig()
      .filter((a) => ids.includes(a.id) && !inCatalog.some((c) => c.id === a.id));
    const merged = [...inCatalog, ...fromMine];
    return merged.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      rating: a.rating,
      downloads: a.downloads
    }));
  });

  fav(id: string): boolean {
    return this.myApps.isFavorite(id);
  }

  toggleFav(id: string): void {
    this.myApps.toggleFavorite(id).subscribe((added) => {
      this.snack.open(added ? 'Agregado a favoritos' : 'Eliminado de favoritos', 'Cerrar', {
        duration: 2000
      });
    });
  }
}
