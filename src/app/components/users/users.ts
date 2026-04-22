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
  page: number = 1;
  pageSize: number = 10;
  searchFirstName: string = '';
  searchLastName: string = '';
  errorMessage: string = '';

  showAddForm: boolean = false;
  addUserForm: any;
  addError: string = '';
  addSuccess: string = '';

  constructor(private webService: WebService,
              private fb: FormBuilder,
              public authService: AuthService) { }

  ngOnInit() {
    this.loadUsers();
    this.addUserForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required],
      tier: ['free', Validators.required]
    });
  }

  loadUsers() {
    this.webService.getUsers(this.page, this.pageSize).subscribe(
      (response) => {
        this.user_list = response;
      },
      (error) => {
        this.errorMessage = 'Failed to load users';
      }
    );
  }

  nextPage() {
    if (this.user_list.length === this.pageSize) {
      this.page = this.page + 1;
      this.loadUsers();
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page = this.page - 1;
      this.loadUsers();
    }
  }

  searchByName() {
    if (!this.searchFirstName && !this.searchLastName) {
      this.loadUsers();
      return;
    }
    this.webService.searchUsersByName(
      this.searchFirstName,
      this.searchLastName
    ).subscribe(
      (response) => {
        this.user_list = response;
      },
      (error) => {
        this.user_list = [];
        this.errorMessage = 'No users found';
      }
    );
  }

  clearSearch() {
    this.searchFirstName = '';
    this.searchLastName = '';
    this.page = 1;
    this.loadUsers();
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.webService.deleteUser(id).subscribe(
        () => {
          this.loadUsers();
        },
        (error) => {
          alert('Failed to delete user');
        }
      );
    }
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.addError = '';
    this.addSuccess = '';
    this.addUserForm.reset({ role: 'user', tier: 'free' });
  }

  onAddUser() {
    if (this.addUserForm.valid) {
      const newUser = {
        profile: {
          first_name: this.addUserForm.value.first_name,
          last_name: this.addUserForm.value.last_name,
          email: this.addUserForm.value.email,
          role: this.addUserForm.value.role
        },
        subscription: {
          tier: this.addUserForm.value.tier,
          status: 'active'
        },
        password: this.addUserForm.value.password
      };

      this.webService.addUser(newUser).subscribe(
        (response) => {
          this.addSuccess = 'User added successfully';
          this.addError = '';
          this.loadUsers();
          setTimeout(() => {
            this.toggleAddForm();
          }, 1500);
        },
        (error) => {
          this.addError = 'Failed to add user — email may already exist';
        }
      );
    }
  }

}