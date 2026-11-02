import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(null);
  readonly isAuthenticatedSig = computed(() => !!this._token());
  private readonly _user = signal<UserProfile | null>(null);
  readonly userSig = computed(() => this._user());

  constructor(private http: HttpClient) {
    const t = localStorage.getItem('auth_token');
    if (t) this._token.set(t);
    const u = localStorage.getItem('auth_user_data');
    if (u) {
      try {
        const parsed = JSON.parse(u) as UserProfile;
        this._user.set(parsed);
      } catch {}
    }
  }

  token(): string | null {
    return this._token();
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>('/api/v1/user-clients/search', { email, password }).pipe(
      map((res) => {
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
          ? res.data
          : res
          ? [res]
          : [];
        const user = arr[0];
        if (!user) return false;
        const tok = user.token ?? `backend-session-${user.id ?? email}`;
        const role = user.role ?? 'admin';
        const uname = user.email ?? user.username ?? email;
        const profile: UserProfile = {
          id: String(user.id ?? ''),
          name: String(user.name ?? uname ?? ''),
          email: String(uname)
        };
        localStorage.setItem('auth_token', tok);
        localStorage.setItem('auth_user', String(uname));
        localStorage.setItem('auth_role', String(role));
        localStorage.setItem('auth_user_data', JSON.stringify(profile));
        this._token.set(tok);
        this._user.set(profile);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  register(name: string, email: string, password: string): Observable<boolean> {
    return this.http.post<any>('/api/v1/user-clients', { name, email, password }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user_data');
    this._token.set(null);
    this._user.set(null);
  }
}
