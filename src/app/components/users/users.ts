import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-users',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users {

  user_list: any[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  searchQuery: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  showAddForm: boolean = false;
  addUserForm: any;
  addError: string = '';
  addSuccess: string = '';

  constructor(private webService: WebService,
              private fb: FormBuilder,
              public authService: AuthService) { }

  ngOnInit() {
    this.addUserForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name:  ['', Validators.required],
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      role:       ['analyst', Validators.required],
      tier:       ['free', Validators.required]
    });
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';
    this.webService.getUsers(this.page, this.pageSize).subscribe({
      next: (response) => {
        this.user_list = response.users;
        this.total = response.total;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  totalPages() { return Math.ceil(this.total / this.pageSize); }

  nextPage() {
    if (this.page < this.totalPages()) { this.page++; this.loadUsers(); }
  }

  previousPage() {
    if (this.page > 1) { this.page--; this.loadUsers(); }
  }

  searchByName() {
    if (!this.searchQuery.trim()) { this.loadUsers(); return; }
    this.isLoading = true;
    this.webService.searchUsers(this.searchQuery.trim()).subscribe({
      next: (response) => {
        this.user_list = response.users || response;
        this.total = response.count || response.total || this.user_list.length;
        this.isLoading = false;
      },
      error: () => {
        this.user_list = [];
        this.errorMessage = 'No users found';
        this.isLoading = false;
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.page = 1;
    this.loadUsers();
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.webService.deleteUser(id).subscribe({
        next: () => { this.loadUsers(); },
        error: () => { alert('Failed to delete user'); }
      });
    }
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.addError = '';
    this.addSuccess = '';
    this.addUserForm.reset({ role: 'analyst', tier: 'free' });
  }

  onAddUser() {
    if (this.addUserForm.valid) {
      const newUser = {
        first_name:        this.addUserForm.value.first_name,
        last_name:         this.addUserForm.value.last_name,
        email:             this.addUserForm.value.email,
        password:          this.addUserForm.value.password,
        role:              this.addUserForm.value.role,
        subscription_tier: this.addUserForm.value.tier
      };
      this.webService.addUser(newUser).subscribe({
        next: () => {
          this.addSuccess = 'User added successfully';
          this.addError = '';
          this.loadUsers();
          setTimeout(() => { this.toggleAddForm(); }, 1500);
        },
        error: (error) => {
          this.addError = error.status === 409 ? 'Email already exists' : 'Failed to add user';
        }
      });
    }
  }
}
