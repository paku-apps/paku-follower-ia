import { Injectable, Signal, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface NotificationItem {
  id: string;
  message: string;
  date: string;
  read?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly _items = signal<NotificationItem[]>([]);

  get items(): Signal<NotificationItem[]> {
    return this._items.asReadonly();
  }

  add(item: NotificationItem): void {
    this._items.update((list) => [item, ...list]);
  }

  list$(): Observable<NotificationItem[]> {
    return of(this._items());
  }
}

