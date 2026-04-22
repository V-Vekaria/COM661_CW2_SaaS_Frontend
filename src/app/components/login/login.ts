import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WebService } from '../../services/web-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  loginForm: any;
  errorMessage: string = '';

  constructor(private fb: FormBuilder,
              private webService: WebService,
              private router: Router) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.webService.login(
        this.loginForm.value.email,
        this.loginForm.value.password
      ).subscribe(
        (response: any) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('role', response.role);
          localStorage.setItem('email', response.email);
          this.router.navigate(['/users']);
        },
        (error: any) => {
          this.errorMessage = 'Invalid email or password';
        }
      )
    }
  }

}