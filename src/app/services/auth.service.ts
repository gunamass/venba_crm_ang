import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment.development';
import { EncryptService } from './Encrypt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private _isLoggedIn: BehaviorSubject<boolean>;
  // isLoggedIn$;

  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this._isLoggedIn.asObservable();
  private apiUrl = environment.apiUrl;


  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cryptoService: EncryptService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isLoggedIn$ = this._isLoggedIn.asObservable();
    this.initializeAuthState();
  }

  private initializeAuthState() {
    if (!this.isBrowser) return;
    
    // Check if sessionStorage is empty but isLoggedIn is set - clear everything
    const isLoggedInFlag = sessionStorage.getItem('isLoggedIn');
    const token = sessionStorage.getItem('token');
    
    if (isLoggedInFlag === 'true' && !token) {
      // Stale login state detected - clear everything
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('id');
      sessionStorage.removeItem('enabled');
      sessionStorage.removeItem('allowedRoutes');
      this._isLoggedIn.next(false);
    } else if (isLoggedInFlag === 'true' && token) {
      // Valid session exists
      this._isLoggedIn.next(true);
    }
  }

  login(encData: string): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/api/auth/signIn2`, { username: null, password: null, encData }, { responseType: 'text' })
      .pipe(
        map((encryptedRes: any) => {
          const decrypted = this.cryptoService.decrypt(encryptedRes);
          if (decrypted?.responseObject?.jwtResponse) {
            const jwt = decrypted.responseObject.jwtResponse;
            if (this.isBrowser) {
              sessionStorage.setItem('isLoggedIn', 'true');
              sessionStorage.setItem('token', jwt.token);
              sessionStorage.setItem('username', JSON.stringify(jwt.username));
              sessionStorage.setItem('role', JSON.stringify(jwt.role));
              sessionStorage.setItem('id', JSON.stringify(jwt.id));
              if (jwt.enabled !== undefined) {
                sessionStorage.setItem('enabled', JSON.stringify(jwt.enabled));
              }
              if (jwt.allowedRoutes !== undefined) {
                sessionStorage.setItem('allowedRoutes', JSON.stringify(jwt.allowedRoutes));
              }
            }
            this._isLoggedIn.next(true);
            return true;
          }
          return false;
        }),
        catchError((err) => {
          console.error('Login failed', err);
          return of(false);
        })
      );
  }


  logOut() {
    this._isLoggedIn.next(false);
    if (this.isBrowser) {
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('id');
      sessionStorage.removeItem('enabled');
      sessionStorage.removeItem('allowedRoutes');
    }
    this.router.navigate(['/']);
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn.value;
  }

  logIn(): boolean {
    this._isLoggedIn.next(true);
    if (this.isBrowser) {
      sessionStorage.setItem('isLoggedIn', 'true');
    }
    return true;
  }



  getRole(): string {
    if (!this.isBrowser) return '';
    const role = sessionStorage.getItem('role');
    return role ? JSON.parse(role) : '';
  }

  getUserId(): string {
    if (!this.isBrowser) return '';
    const id = sessionStorage.getItem('id');
    return id ? JSON.parse(id) : '';
  }

  getUsername(): string {
    if (!this.isBrowser) return '';
    const username = sessionStorage.getItem('username');
    return username ? JSON.parse(username) : '';
  }

  isSuperAdmin(): boolean {
    return this.getRole().toUpperCase() === 'SUPER_ADMIN';
  }

  isAdmin(): boolean {
    const role = this.getRole().toUpperCase();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  isStaff(): boolean {
    return this.getRole().toUpperCase() === 'STAFF';
  }
}
