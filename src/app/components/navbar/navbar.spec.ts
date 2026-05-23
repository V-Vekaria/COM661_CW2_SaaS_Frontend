import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { AuthService } from '../../services/auth';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

function makeAuthMock(opts: { loggedIn: boolean; role: string }) {
  return {
    isLoggedIn: vi.fn().mockReturnValue(opts.loggedIn),
    isAdmin: vi.fn().mockReturnValue(opts.role === 'admin'),
    isAnalyst: vi.fn().mockReturnValue(opts.role === 'analyst'),
    canViewUsers: vi.fn().mockReturnValue(
      opts.loggedIn && (opts.role === 'admin' || opts.role === 'analyst')
    ),
    canViewAnomalies: vi.fn().mockReturnValue(
      opts.loggedIn && (opts.role === 'admin' || opts.role === 'analyst')
    ),
    canViewAnalytics: vi.fn().mockReturnValue(
      opts.loggedIn && (opts.role === 'admin' || opts.role === 'analyst')
    ),
    getRole: vi.fn().mockReturnValue(opts.role),
    getEmail: vi.fn().mockReturnValue('test@test.com'),
    logout: vi.fn()
  };
}

async function setup(opts: { loggedIn: boolean; role: string }) {
  const mockAuth = makeAuthMock(opts);
  await TestBed.configureTestingModule({
    imports: [Navbar],
    providers: [
      { provide: AuthService, useValue: mockAuth },
      provideRouter([])
    ]
  }).compileComponents();
  const fixture = TestBed.createComponent(Navbar);
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockAuth };
}

describe('Navbar Component', () => {

  // ── Not logged in ───────────────────────────────────────────────────────────
  describe('when not logged in', () => {
    it('shows Login link', async () => {
      const { compiled } = await setup({ loggedIn: false, role: '' });
      expect(compiled.innerHTML).toContain('Login');
    });

    it('does not show Dashboard link', async () => {
      const { compiled } = await setup({ loggedIn: false, role: '' });
      const navLinks = Array.from(compiled.querySelectorAll('a.nav-link'));
      expect(navLinks.map(l => l.textContent?.trim())).not.toContain('Dashboard');
    });

    it('does not show Users link', async () => {
      const { compiled } = await setup({ loggedIn: false, role: '' });
      expect(compiled.textContent).not.toContain('Users');
    });

    it('does not show Logout', async () => {
      const { compiled } = await setup({ loggedIn: false, role: '' });
      const navLinks = Array.from(compiled.querySelectorAll('a.nav-link'));
      expect(navLinks.map(l => l.textContent?.trim())).not.toContain('Logout');
    });
  });

  // ── Admin role ──────────────────────────────────────────────────────────────
  describe('Admin role', () => {
    it('shows Dashboard link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('Dashboard');
    });

    it('shows Users link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('Users');
    });

    it('shows Activity Logs link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('Activity Logs');
    });

    it('shows Anomaly Flags link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('Anomaly Flags');
    });

    it('shows Analytics link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('Analytics');
    });

    it('shows current user email', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('test@test.com');
    });

    it('shows role label (admin)', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('admin');
    });

    it('shows Logout link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'admin' });
      expect(compiled.innerHTML).toContain('Logout');
    });

    it('calls authService.logout() when Logout is clicked', async () => {
      const { compiled, mockAuth } = await setup({ loggedIn: true, role: 'admin' });
      const logoutLink = Array.from(compiled.querySelectorAll('a.nav-link'))
        .find(l => l.textContent?.includes('Logout')) as HTMLElement;
      logoutLink?.click();
      expect(mockAuth.logout).toHaveBeenCalled();
    });
  });

  // ── Analyst role ────────────────────────────────────────────────────────────
  describe('Analyst role', () => {
    it('shows Dashboard link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('Dashboard');
    });

    it('shows Users link — analyst can view users (canViewUsers fix)', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('Users');
    });

    it('shows Activity Logs link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('Activity Logs');
    });

    it('shows Anomaly Flags link — analyst can view anomalies (canViewAnomalies fix)', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('Anomaly Flags');
    });

    it('shows Analytics link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('Analytics');
    });

    it('shows role label (analyst)', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('analyst');
    });

    it('shows Logout link', async () => {
      const { compiled } = await setup({ loggedIn: true, role: 'analyst' });
      expect(compiled.innerHTML).toContain('Logout');
    });
  });
});
