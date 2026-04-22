import { Injectable } from "@angular/core";
import { WebService } from "./web-service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webService: WebService, 
    private router: Router) { }
  login(email: string, password: string) {
    return this.webService.login(email, password).subscribe(
      (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('email', response.email);
        this.router.navigate(['/users']);
      },
      (error) => {
        console.log(error);
      }
    )
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }
}