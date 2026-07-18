import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { AllApiService } from '../../services/all-api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login-creation',
  templateUrl: './login-creation.component.html',
  styleUrls: ['./login-creation.component.css'],
  imports: [SharedCommonModule]
})
export class LoginCreationComponent implements OnInit {
  loginForm: FormGroup;
  staticAdminKey = 'ADMIN123';
  roles: string[] = ['Admin', 'Manager', 'User'];

  customRoleSelected = false;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar,
    private api: AllApiService,
    private route: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      role: ['', Validators.required],
      adminKey: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {

  }

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  onRoleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    console.log(value);

    this.customRoleSelected = value === 'custom';
    if (this.customRoleSelected) {
      this.loginForm.get('role')?.setValue('');
      this.loginForm.get('role')?.setValidators(Validators.required);
    } else {
      this.loginForm.get('role')?.setValue(value); // <-- Use the extracted string value, NOT the event object
      this.loginForm.get('role')?.clearValidators();
    }
    this.loginForm.get('role')?.updateValueAndValidity();
  }


  onSubmit() {
    if (this.loginForm.invalid) {
      this.showSnackBar('Please fill all fields correctly');
      return;
    }
    if (this.loginForm.value.adminKey !== this.staticAdminKey) {
      this.showSnackBar('Incorrect Admin Key');
      return;
    }

    let payLoad = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value,
      role: this.loginForm.get('role')?.value
    }
    console.log(payLoad);


    this.api.creatAcc(payLoad).subscribe({
      next: () => {
        this.showSnackBar('User created successfully', true);
        this.loginForm.reset();
        this.customRoleSelected = false;
      },
      error: () => this.showSnackBar('Error creating user'),
      complete: () => this.route.navigate([''])
    });
  }

  showSnackBar(message: string, success?: boolean) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: success ? 'snack-success' : 'snack-error'
    });
  }
}