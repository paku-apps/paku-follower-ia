import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

type MyAppsApiItem = {
  id: string;
  app?: {
    id: string;
    name: string;
    category: string;
    rating: number;
    downloads: number;
    iconUrl?: string;
    developer?: string;
  };
};

@Injectable({ providedIn: 'root' })
export class MyAppsService {
  private readonly ids = signal<string[]>([]);
  private readonly details = signal<Record<string, { id: string; name: string; category: string; rating: number; downloads: number; iconUrl?: string; developer?: string }>>({});
  readonly favoritesSig = computed(() => this.ids());
  readonly favoritesDetailsSig = computed(() => Object.values(this.details()));

  constructor(private http: HttpClient, private auth: AuthService) {}

  isFavorite(appId: string): boolean {
    return this.ids().includes(appId);
  }

  fetchMine(userId: string): Observable<string[]> {
    return this.http.get<MyAppsApiItem[] | MyAppsApiItem | { items: MyAppsApiItem[] } | { data: MyAppsApiItem[] }>(`/api/v1/user-clients/${userId}/my-apps`).pipe(
      map((res) => {
        const arr: MyAppsApiItem[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray((res as any)?.data)
          ? (res as any).data
          : res
          ? [res as MyAppsApiItem]
          : [];
        const ids = arr
          .map((x) => String(x.app?.id || ''))
          .filter((id) => !!id && id !== 'undefined' && id !== 'null');
        const mapDetails: Record<string, { id: string; name: string; category: string; rating: number; downloads: number; iconUrl?: string; developer?: string }> = {};
        arr.forEach((x) => {
          const a = x.app;
          if (a?.id) {
            mapDetails[a.id] = {
              id: a.id,
              name: a.name,
              category: a.category,
              rating: a.rating,
              downloads: a.downloads,
              iconUrl: a.iconUrl,
              developer: a.developer
            };
          }
        });
        this.details.set(mapDetails);
        return ids;
      }),
      tap((list) => this.ids.set(list)),
      catchError(() => {
        this.ids.set([]);
        this.details.set({});
        return of([]);
      })
    );
  }

  addFavorite(userId: string, appId: string): Observable<void> {
    if (!appId) return of(void 0);
    return this.http.post<void>(`/api/v1/user-clients/${userId}/my-apps`, { appId }).pipe(
      tap(() => {
        const set = new Set(this.ids());
        set.add(appId);
        this.ids.set(Array.from(set));
      }),
      catchError(() => of(void 0))
    );
  }

  removeFavorite(userId: string, appId: string): Observable<void> {
    if (!appId) return of(void 0);
    return this.http.delete<void>(`/api/v1/user-clients/${userId}/my-apps/${appId}`).pipe(
      tap(() => {
        const list = this.ids().filter((id) => id !== appId);
        this.ids.set(list);
      }),
      catchError(() => of(void 0))
    );
  }

  toggleFavorite(appId: string): Observable<boolean> {
    const user = this.auth.userSig();
    if (!user?.id) return of(this.isFavorite(appId));
    return (this.isFavorite(appId)
      ? this.removeFavorite(user.id, appId).pipe(map(() => false))
      : this.addFavorite(user.id, appId).pipe(map(() => true)));
  }
}
