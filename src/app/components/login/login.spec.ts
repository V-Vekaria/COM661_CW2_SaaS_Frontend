import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { WebService } from '../../services/web-service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

async function setup(opts: {
  webLogin?: any;
  alreadyLoggedIn?: boolean;
} = {}) {
  if (opts.alreadyLoggedIn) {
    localStorage.setItem('token', 'existing-token');
  } else {
    localStorage.clear();
  }

  const mockWeb = {
    login: opts.webLogin ?? vi.fn().mockReturnValue(
      of({ token: 'new-token', role: 'admin', email: 'admin@test.com' })
    )
  };
  const mockRouter = { navigate: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      { provide: WebService, useValue: mockWeb },
      { provide: Router, useValue: mockRouter },
      provideRouter([])
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb, mockRouter };
}

describe('LoginComponent', () => {

  afterEach(() => localStorage.clear());

  // ── Already logged in ─────────────────────────────────────────────────────────
  describe('when already logged in', () => {
    it('redirects to /dashboard without rendering form', async () => {
      const { mockRouter } = await setup({ alreadyLoggedIn: true });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  // ── Form rendering ────────────────────────────────────────────────────────────
  describe('form rendering', () => {
    it('renders email input', async () => {
      const { compiled } = await setup();
      expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    });

    it('renders password input', async () => {
      const { compiled } = await setup();
      expect(compiled.querySelector('input[type="password"]')).toBeTruthy();
    });

    it('renders submit button', async () => {
      const { compiled } = await setup();
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });
  });

  // ── Successful login ──────────────────────────────────────────────────────────
  describe('successful login', () => {
    it('calls webService.login with email and password', async () => {
      const { fixture, mockWeb } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'admin@test.com', password: 'secret' });
      comp.onSubmit();
      expect(mockWeb.login).toHaveBeenCalledWith('admin@test.com', 'secret');
    });

    it('stores token in localStorage after successful login', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'admin@test.com', password: 'secret' });
      comp.onSubmit();
      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('stores role in localStorage after successful login', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'admin@test.com', password: 'secret' });
      comp.onSubmit();
      expect(localStorage.getItem('role')).toBe('admin');
    });

    it('stores email in localStorage after successful login', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'admin@test.com', password: 'secret' });
      comp.onSubmit();
      expect(localStorage.getItem('email')).toBe('admin@test.com');
    });

    it('navigates to /dashboard after successful login', async () => {
      const { fixture, mockRouter } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'admin@test.com', password: 'secret' });
      comp.onSubmit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('works for analyst role too (stores analyst role)', async () => {
      const { fixture } = await setup({
        webLogin: vi.fn().mockReturnValue(
          of({ token: 'analyst-token', role: 'analyst', email: 'analyst@test.com' })
        )
      });
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'analyst@test.com', password: 'pass123' });
      comp.onSubmit();
      expect(localStorage.getItem('role')).toBe('analyst');
      expect(localStorage.getItem('token')).toBe('analyst-token');
    });
  });

  // ── Failed login ──────────────────────────────────────────────────────────────
  describe('failed login', () => {
    it('shows error message on 401 response', async () => {
      const { fixture } = await setup({
        webLogin: vi.fn().mockReturnValue(throwError(() => ({ status: 401 })))
      });
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'wrong@test.com', password: 'wrong' });
      comp.onSubmit();
      expect(comp.errorMessage).toBe('Invalid email or password');
    });

    it('does not navigate on login failure', async () => {
      const { fixture, mockRouter } = await setup({
        webLogin: vi.fn().mockReturnValue(throwError(() => ({ status: 401 })))
      });
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'wrong@test.com', password: 'wrong' });
      comp.onSubmit();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('does not call login when form is invalid', async () => {
      const { fixture, mockWeb } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: '', password: '' });
      comp.onSubmit();
      expect(mockWeb.login).not.toHaveBeenCalled();
    });

    it('does not call login with invalid email format', async () => {
      const { fixture, mockWeb } = await setup();
      const comp = fixture.componentInstance;
      comp.loginForm.setValue({ email: 'not-an-email', password: 'pass' });
      comp.onSubmit();
      expect(mockWeb.login).not.toHaveBeenCalled();
    });
  });
});
