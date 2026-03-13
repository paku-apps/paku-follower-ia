import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreApp } from '../models/store.models';

export interface AppSummary {
  id: string;
  name: string;
  category: string;
  rating: number;
  downloads: number;
  iconUrl: string;
  developer: string;
}

@Injectable({ providedIn: 'root' })
export class AppsService {
  private readonly state = signal<AppSummary[]>([]);
  constructor(private http: HttpClient) {}

  readonly appsSig = computed(() => this.state());

  listAll(): Observable<AppSummary[]> {
    return this.http.get<StoreApp[] | StoreApp>('/apps').pipe(
      map((res) => (Array.isArray(res) ? res : [res])),
      map((arr) =>
        arr.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          rating: a.rating,
          downloads: a.downloads,
          iconUrl: a.iconUrl,
          developer: a.developer
        }))
      )
    );
  }

  listMine(): Observable<AppSummary[]> {
    return this.listAll();
  }

  fetchAll(): void {
    this.listAll().subscribe((apps) => this.state.set(apps));
  }

  getById(id: string): Observable<StoreApp> {
    return this.http.get<StoreApp>(`/apps/${id}`);
  }
}
