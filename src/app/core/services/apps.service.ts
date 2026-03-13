import { Injectable, computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AppSummary {
  id: string;
  name: string;
  category: string;
  owner: boolean;
  rating: number;
  reviews: number;
}

@Injectable({ providedIn: 'root' })
export class AppsService {
  private readonly state = signal<AppSummary[]>([
    { id: '1', name: 'Paku Notes', category: 'Productividad', owner: true, rating: 4.7, reviews: 1200 },
    { id: '2', name: 'Paku Tasks', category: 'Gestión', owner: false, rating: 4.2, reviews: 980 },
    { id: '3', name: 'FitPaku', category: 'Salud', owner: true, rating: 4.5, reviews: 540 },
    { id: '4', name: 'Paku Finance', category: 'Finanzas', owner: false, rating: 4.0, reviews: 230 }
  ]);

  readonly appsSig = computed(() => this.state());

  listAll(): Observable<AppSummary[]> {
    return of(this.state());
  }

  listMine(): Observable<AppSummary[]> {
    return of(this.state().filter((a) => a.owner));
  }
}

