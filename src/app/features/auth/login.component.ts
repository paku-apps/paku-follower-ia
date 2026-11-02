import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="content" style="display:flex;align-items:center;justify-content:center;height:100%">
      <div class="card" style="max-width:360px;width:100%">
        <h3 style="margin:0 0 16px 0">{{ isRegister() ? 'Crear Cuenta' : 'Acceso Administrativo' }}</h3>
        <form *ngIf="!isRegister()" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="fill" style="width:100%">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" autocomplete="email" />
          </mat-form-field>
          <mat-form-field appearance="fill" style="width:100%">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="showLoginPwd() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="toggleLoginPwd()" aria-label="Ver contraseña">
              <mat-icon>{{ showLoginPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          <div *ngIf="error()" style="color: var(--danger); font-size: 13px; margin-bottom: 8px">
            Credenciales inválidas
          </div>
          <button mat-flat-button color="primary" [disabled]="form.invalid || loading()" style="width:100%">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
          <div style="margin-top:10px;text-align:center">
            <a (click)="toggleRegister()" style="cursor:pointer;color:var(--accent)">Crear cuenta</a>
          </div>
        </form>
        <form *ngIf="isRegister()" [formGroup]="registerForm" (ngSubmit)="submitRegister()">
          <mat-form-field appearance="fill" style="width:100%">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" autocomplete="name" />
          </mat-form-field>
          <mat-form-field appearance="fill" style="width:100%">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" autocomplete="email" />
          </mat-form-field>
          <mat-form-field appearance="fill" style="width:100%">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="showRegisterPwd() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
            <button mat-icon-button matSuffix type="button" (click)="toggleRegisterPwd()" aria-label="Ver contraseña">
              <mat-icon>{{ showRegisterPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          <div *ngIf="regError()" style="color: var(--danger); font-size: 13px; margin-bottom: 8px">
            No se pudo crear la cuenta
          </div>
          <button mat-flat-button color="primary" [disabled]="registerForm.invalid || regLoading()" style="width:100%">
            {{ regLoading() ? 'Creando...' : 'Crear cuenta' }}
          </button>
          <div style="margin-top:10px;text-align:center">
            <a (click)="toggleRegister()" style="cursor:pointer;color:var(--accent)">Ya tengo cuenta</a>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly isRegister = signal(false);
  readonly regLoading = signal(false);
  readonly regError = signal(false);
  readonly showLoginPwd = signal(false);
  readonly showRegisterPwd = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  readonly registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(false);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email ?? '', password ?? '').subscribe((ok) => {
      this.loading.set(false);
      if (ok) {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';
        this.router.navigateByUrl(redirectTo);
      } else {
        this.error.set(true);
      }
    });
  }

  submitRegister() {
    if (this.registerForm.invalid || this.regLoading()) return;
    this.regLoading.set(true);
    this.regError.set(false);
    const { name, email, password } = this.registerForm.getRawValue();
    this.auth.register(name ?? '', email ?? '', password ?? '').subscribe((ok) => {
      this.regLoading.set(false);
      if (ok) {
        this.auth.login(email ?? '', password ?? '').subscribe((logged) => {
          if (logged) {
            const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';
            this.router.navigateByUrl(redirectTo);
          } else {
            this.isRegister.set(false);
          }
        });
      } else {
        this.regError.set(true);
      }
    });
  }

  toggleRegister() {
    this.isRegister.update((v) => !v);
  }

  toggleLoginPwd() {
    this.showLoginPwd.update((v) => !v);
  }
  toggleRegisterPwd() {
    this.showRegisterPwd.update((v) => !v);
  }
}
