import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { WebService } from './web-service';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockRouter = { navigate: vi.fn() };
  const mockWebService = { login: vi.fn(), logout: vi.fn().mockReturnValue(of({})) };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: WebService, useValue: mockWebService },
        { provide: Router, useValue: mockRouter }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  // ── isLoggedIn ──────────────────────────────────────────────────────────────
  describe('isLoggedIn()', () => {
    it('returns false when no token in localStorage', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true when token exists in localStorage', () => {
      localStorage.setItem('token', 'mock-token');
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  // ── getRole / getEmail ──────────────────────────────────────────────────────
  describe('getRole()', () => {
    it('returns null when no role stored', () => {
      expect(service.getRole()).toBeNull();
    });

    it('returns stored role', () => {
      localStorage.setItem('role', 'admin');
      expect(service.getRole()).toBe('admin');
    });
  });

  describe('getEmail()', () => {
    it('returns null when no email stored', () => {
      expect(service.getEmail()).toBeNull();
    });

    it('returns stored email', () => {
      localStorage.setItem('email', 'admin@test.com');
      expect(service.getEmail()).toBe('admin@test.com');
    });
  });

  // ── isAdmin ─────────────────────────────────────────────────────────────────
  describe('isAdmin()', () => {
    it('returns true when role is admin', () => {
      localStorage.setItem('role', 'admin');
      expect(service.isAdmin()).toBe(true);
    });

    it('returns false when role is analyst', () => {
      localStorage.setItem('role', 'analyst');
      expect(service.isAdmin()).toBe(false);
    });

    it('returns false when no role', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  // ── isAnalyst ───────────────────────────────────────────────────────────────
  describe('isAnalyst()', () => {
    it('returns true when role is analyst', () => {
      localStorage.setItem('role', 'analyst');
      expect(service.isAnalyst()).toBe(true);
    });

    it('returns false when role is admin', () => {
      localStorage.setItem('role', 'admin');
      expect(service.isAnalyst()).toBe(false);
    });

    it('returns false when no role', () => {
      expect(service.isAnalyst()).toBe(false);
    });
  });

  // ── canViewUsers (bug fix: was isModerator, now isAnalyst) ──────────────────
  describe('canViewUsers()', () => {
    it('returns true for admin', () => {
      localStorage.setItem('role', 'admin');
      expect(service.canViewUsers()).toBe(true);
    });

    it('returns true for analyst', () => {
      localStorage.setItem('role', 'analyst');
      expect(service.canViewUsers()).toBe(true);
    });

    it('returns false when not logged in', () => {
      expect(service.canViewUsers()).toBe(false);
    });

    it('returns false for unknown role', () => {
      localStorage.setItem('role', 'guest');
      expect(service.canViewUsers()).toBe(false);
    });
  });

  // ── canViewAnomalies (bug fix: was isModerator, now isAnalyst) ──────────────
  describe('canViewAnomalies()', () => {
    it('returns true for admin', () => {
      localStorage.setItem('role', 'admin');
      expect(service.canViewAnomalies()).toBe(true);
    });

    it('returns true for analyst', () => {
      localStorage.setItem('role', 'analyst');
      expect(service.canViewAnomalies()).toBe(true);
    });

    it('returns false for unknown role', () => {
      localStorage.setItem('role', 'guest');
      expect(service.canViewAnomalies()).toBe(false);
    });
  });

  // ── canViewAnalytics ─────────────────────────────────────────────────────────
  describe('canViewAnalytics()', () => {
    it('returns true for admin', () => {
      localStorage.setItem('role', 'admin');
      expect(service.canViewAnalytics()).toBe(true);
    });

    it('returns true for analyst', () => {
      localStorage.setItem('role', 'analyst');
      expect(service.canViewAnalytics()).toBe(true);
    });

    it('returns false when no role', () => {
      expect(service.canViewAnalytics()).toBe(false);
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('clears token, role, and email from localStorage', () => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('role', 'admin');
      localStorage.setItem('email', 'admin@test.com');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
    });

    it('navigates to /login after logout', () => {
      service.logout();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
