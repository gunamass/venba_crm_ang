import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EncryptService } from '../../services/Encrypt.service';
import { AllApiService } from '../../services/all-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [SharedCommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  adminLoginForm: FormGroup;

  constructor(private fb: FormBuilder,
    private notify: MatSnackBar,
    private router: Router,
    private cryptoService: EncryptService,
    private api: AllApiService,
    private auth: AuthService

  ) {
    this.adminLoginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onAdminLogin() {
    if (this.adminLoginForm.valid) {
      const { username, password } = this.adminLoginForm.value;
      // console.log(username, password);
      const encData = this.cryptoService.encrypt({ username, password });
      // console.log(encData);
      let payLoad = {
        encData: encData,
        username: "string",
        password: "string"
      }

      this.auth.login(encData).subscribe((success) => {
        if (success) {
          this.notify.open(`${'Auth SuccessFul'}`, 'close', { duration: 1500 })
          this.router.navigate(['admin/dashboard'])

        } else {
          this.notify.open(`${'err.error.message'}`, 'close', { duration: 1500 })
        }
      });
    }
    else {
      this.adminLoginForm.markAllAsTouched();
    }
  }

}