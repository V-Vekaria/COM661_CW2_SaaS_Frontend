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
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        console.log(error);
      }
    )
  }

  logout() {
    this.webService.logout().subscribe({
      next: () => {},
      error: () => {}
    });
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isAnalyst(): boolean {
    return this.getRole() === 'analyst';
  }

  canViewUsers(): boolean {
    return this.isAdmin() || this.isAnalyst();
  }

  canViewAnomalies(): boolean {
    return this.isAdmin() || this.isAnalyst();
  }

  canViewAnalytics(): boolean {
    return this.isAdmin() || this.isAnalyst();
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }
}