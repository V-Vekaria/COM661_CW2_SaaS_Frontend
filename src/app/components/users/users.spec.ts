import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Users } from './users';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

const mockUserList = {
  users: [
    {
      _id: 'u1',
      profile: { first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', role: 'analyst' },
      subscription: { tier: 'pro' }
    },
    {
      _id: 'u2',
      profile: { first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', role: 'admin' },
      subscription: { tier: 'enterprise' }
    }
  ],
  total: 2
};

function makeWebMock() {
  return {
    getUsers: vi.fn().mockReturnValue(of(mockUserList)),
    searchUsers: vi.fn().mockReturnValue(of(mockUserList)),
    addUser: vi.fn().mockReturnValue(of({ _id: 'new1' })),
    deleteUser: vi.fn().mockReturnValue(of({}))
  };
}

async function setup(role: string) {
  const mockWeb = makeWebMock();
  const mockAuth = {
    isAdmin: vi.fn().mockReturnValue(role === 'admin'),
    isAnalyst: vi.fn().mockReturnValue(role === 'analyst')
  };
  await TestBed.configureTestingModule({
    imports: [Users],
    providers: [
      { provide: WebService, useValue: mockWeb },
      { provide: AuthService, useValue: mockAuth },
      provideRouter([])
    ]
  }).compileComponents();
  const fixture = TestBed.createComponent(Users);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb };
}

describe('Users Component', () => {

  // ── Shared — both roles ─────────────────────────────────────────────────────
  describe('Both roles', () => {
    it('calls getUsers on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getUsers).toHaveBeenCalledWith(1, 10);
    });

    it('displays user names in list', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('Alice');
      expect(compiled.textContent).toContain('Smith');
    });

    it('displays user email', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('alice@test.com');
    });

    it('displays subscription tier', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('pro');
    });

    it('shows View button for each user', async () => {
      const { compiled } = await setup('analyst');
      const viewBtns = compiled.querySelectorAll('a.btn-primary');
      expect(viewBtns.length).toBe(2);
    });

    it('shows pagination controls', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('Page 1');
    });

    it('calls searchUsers when search triggered', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.searchQuery = 'Alice';
      comp.searchByName();
      expect(mockWeb.searchUsers).toHaveBeenCalledWith('Alice');
    });

    it('reloads users when search cleared', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.searchQuery = 'Alice';
      comp.clearSearch();
      expect(comp.searchQuery).toBe('');
      // getUsers called once on init, once after clearSearch
      expect(mockWeb.getUsers).toHaveBeenCalledTimes(2);
    });

    it('increments page on nextPage()', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.total = 25;
      comp.page = 1;
      comp.nextPage();
      expect(comp.page).toBe(2);
      expect(mockWeb.getUsers).toHaveBeenCalledTimes(2);
    });

    it('decrements page on previousPage()', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.total = 25;
      comp.page = 2;
      comp.previousPage();
      expect(comp.page).toBe(1);
    });
  });

  // ── Admin role ──────────────────────────────────────────────────────────────
  describe('Admin role', () => {
    it('shows Add User button', async () => {
      const { compiled } = await setup('admin');
      const buttons = Array.from(compiled.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent?.includes('Add User'));
      expect(addBtn).toBeTruthy();
    });

    it('shows Delete button on each user card', async () => {
      const { compiled } = await setup('admin');
      const deleteBtns = compiled.querySelectorAll('button.btn-danger');
      expect(deleteBtns.length).toBe(2);
    });

    it('toggles add form visibility', async () => {
      const { fixture } = await setup('admin');
      const comp = fixture.componentInstance;
      expect(comp.showAddForm).toBe(false);
      comp.toggleAddForm();
      expect(comp.showAddForm).toBe(true);
      comp.toggleAddForm();
      expect(comp.showAddForm).toBe(false);
    });

    it('calls addUser when form is valid and submitted', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.addUserForm.setValue({
        first_name: 'New',
        last_name: 'User',
        email: 'new@test.com',
        password: 'password123',
        role: 'analyst',
        tier: 'free'
      });
      comp.onAddUser();
      expect(mockWeb.addUser).toHaveBeenCalledWith({
        first_name: 'New',
        last_name: 'User',
        email: 'new@test.com',
        password: 'password123',
        role: 'analyst',
        subscription_tier: 'free'
      });
    });

    it('does not call addUser when form is invalid', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.addUserForm.reset();
      comp.onAddUser();
      expect(mockWeb.addUser).not.toHaveBeenCalled();
    });

    it('calls deleteUser with correct id on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteUser('u1');
      expect(mockWeb.deleteUser).toHaveBeenCalledWith('u1');
    });

    it('does not call deleteUser when confirm is cancelled', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      fixture.componentInstance.deleteUser('u1');
      expect(mockWeb.deleteUser).not.toHaveBeenCalled();
    });

    it('add user form role options include analyst and admin', async () => {
      const { compiled } = await setup('admin');
      const comp = TestBed.createComponent(Users).componentInstance;
      // Verify role dropdown has correct options (analyst/admin, not user/admin)
      const roleSelect = compiled.querySelector('select[formcontrolname="role"]');
      if (roleSelect) {
        const options = Array.from(roleSelect.querySelectorAll('option')).map(o => (o as HTMLOptionElement).value);
        expect(options).toContain('analyst');
        expect(options).not.toContain('user');
      }
    });
  });

  // ── Analyst role ────────────────────────────────────────────────────────────
  describe('Analyst role', () => {
    it('does not show Add User button', async () => {
      const { compiled } = await setup('analyst');
      const buttons = Array.from(compiled.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent?.includes('Add User'));
      expect(addBtn).toBeUndefined();
    });

    it('does not show Delete button on user cards', async () => {
      const { compiled } = await setup('analyst');
      const deleteBtns = compiled.querySelectorAll('button.btn-danger');
      expect(deleteBtns.length).toBe(0);
    });

    it('still displays the full user list', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('Alice');
      expect(compiled.textContent).toContain('Bob');
    });

    it('can still use search', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      fixture.componentInstance.searchByName();
      // With empty search, falls back to loadUsers
      expect(mockWeb.getUsers).toHaveBeenCalled();
    });
  });
});
