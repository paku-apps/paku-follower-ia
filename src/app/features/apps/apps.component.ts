import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AppsService } from '../../core/services/apps.service';

type AppItem = {
  id: string;
  name: string;
  category: string;
  my: boolean;
  rating: number;
  reviews: number;
};

@Component({
  selector: 'app-apps',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="card">
      <h3 style="margin: 0 0 12px 0">
        {{ mine() ? 'Mis Apps' : 'Catálogo de Apps' }}
      </h3>
      <div class="grid cols-3">
        <div class="card" *ngFor="let app of filtered()">
          <div style="font-weight: 600">{{ app.name }}</div>
          <div style="opacity: 0.7; font-size: 12px">{{ app.category }}</div>
          <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center">
            <span>★ {{ app.rating }}</span>
            <span style="opacity: 0.7">{{ app.reviews }} reviews</span>
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

  readonly mine = signal<boolean>(false);

  constructor() {
    const mineFlag = this.route.snapshot.data['mine'] === true;
    this.mine.set(mineFlag);
  }

  readonly filtered = computed(() => {
    const all = this.apps.appsSig();
    return all
      .filter((a) => (this.mine() ? a.owner : true))
      .map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        my: a.owner,
        rating: a.rating,
        reviews: a.reviews
      }));
  });
}
