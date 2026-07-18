import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { MatDialogRef } from '@angular/material/dialog';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-record-payment-dialog',
  standalone: true,
  imports: [CommonModule, SharedCommonModule],
  template: `
    <div class="record-payment-dialog">
      <!-- Header -->
      <div class="dialog-header border-bottom pb-3 mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="fw-bold mb-1 text-gradient">
              <i class="fas fa-money-check-alt me-2 text-success"></i>
              Record New Payment
            </h4>
            <p class="text-muted small mb-0">Process student fee payment quickly</p>
          </div>
          <button mat-icon-button class="close-btn" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="dialog-body">
        <!-- Student Selection with Enhanced Search -->
        <div class="mb-4">

          <mat-form-field class=" w-50 modern-field" appearance="outline">
            <mat-label> <i class="fas fa-user-graduate me-1"></i> Search by name or ID</mat-label>
            <input type="text"
                   placeholder="Type to search..."
                   matInput
                   [formControl]="studentControl"
                   [matAutocomplete]="auto">
            <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn" (optionSelected)="onStudentSelected($event.option.value)" class="modern-autocomplete">
              <mat-option *ngFor="let student of filteredStudents | async" [value]="student" class="student-option">
                <div class="d-flex justify-content-between align-items-center py-1">
                  <div>
                    <div class="fw-semibold">{{student.fullName}}</div>
                    <small class="text-muted">{{student.course}} • {{student.shift}} Batch</small>
                  </div>
                  <div class="text-end">
                    <span class="badge" [class.bg-danger-subtle]="(student.balanceFee || 0) > 0" [class.bg-success-subtle]="(student.balanceFee || 0) == 0" 
                          [class.text-danger]="(student.balanceFee || 0) > 0" [class.text-success]="(student.balanceFee || 0) == 0">{{ student.studentID }}</span>
                  </div>
                </div>
              </mat-option>
            </mat-autocomplete>
            <mat-icon matSuffix class="text-muted">search</mat-icon>
          </mat-form-field>
        </div>

        <!-- Student Summary Card (Enhanced) -->
        <div *ngIf="selectedStudent" class="student-card card shadow-sm border-0 mb-4 animate__animated animate__fadeIn animate__faster">
          <div class="card-body p-4" [ngStyle]="{'background': (selectedStudent.balanceFee || 0) > 0 ? 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)' : 'linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%)'}">
            <div class="row align-items-center g-3">
              <div class="col">
                <div class="d-flex align-items-center mb-2">
                  <div class="avatar-circle me-3">
                    <i class="fas fa-user-graduate"></i>
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold">{{selectedStudent.fullName}}</h6>
                    <small class="text-muted">ID: {{selectedStudent.studentID}}</small>
                  </div>
                </div>
                <div class="d-flex gap-3 mt-2">
                  <div>
                    <small class="text-muted d-block">Course</small>
                    <span class="fw-semibold small">{{selectedStudent.course}}</span>
                  </div>
                  <div class="vr"></div>
                  <div>
                    <small class="text-muted d-block">Batch</small>
                    <span class="fw-semibold small">{{selectedStudent.shift}}</span>
                  </div>
                </div>
              </div>
              <div class="col-auto text-end">
                <div class="balance-box p-3 rounded-3 bg-white shadow-sm">
                  <small class="text-muted d-block mb-1">Outstanding Balance</small>
                  <h4 class="mb-0 fw-bold" [class.text-danger]="(selectedStudent.balanceFee || 0) > 0" [class.text-success]="(selectedStudent.balanceFee || 0) == 0">
                    ₹{{selectedStudent.balanceFee | number}}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Installments -->
        <div *ngIf="selectedStudent && (selectedStudent.dueDay?.length > 0)" class="installments-section animate__animated animate__fadeIn">
          <label class="form-label fw-semibold text-muted small text-uppercase mb-3">
            <i class="fas fa-calendar-check me-1"></i> Pending Installments
          </label>
          
          <div class="installments-grid mb-4">
            <div *ngFor="let due of getPendingDues()" 
                 class="installment-card card border-0 shadow-sm mb-2"
                 [class.selected]="selectedDue?.id === due.id"
                 (click)="selectDue(due)">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <div class="installment-icon me-3">
                      <i class="fas fa-receipt"></i>
                    </div>
                    <div>
                      <div class="fw-bold">Installment #{{due.dueNo}}</div>
                      <small class="text-muted">
                        <i class="fas fa-calendar-day me-1"></i>
                        Due: {{due.dueDate | date:'MMM d, y'}}
                      </small>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-bold h5 mb-1">₹{{due.dueAmt | number}}</div>
                    <span class="badge rounded-pill" 
                          [class.bg-danger]="due.status === 'Not Paid'" 
                          [class.bg-warning]="due.status === 'Pending'"
                          [class.bg-success]="due.status === 'Paid'">
                      {{due.status}}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Details Form -->
          <div *ngIf="selectedDue" class="payment-form card border-0 bg-light p-4 animate__animated animate__fadeIn animate__faster">
            <label class="form-label fw-semibold text-muted small text-uppercase mb-3">
              <i class="fas fa-credit-card me-1"></i> Payment Details
            </label>
            <div class="row g-3">
              <div class="col-md-6">
                <mat-form-field class="w-100 modern-field" appearance="outline">
                  <mat-label>Payment Mode</mat-label>
                  <mat-select [(ngModel)]="paymentMode">
                    <mat-option value="Cash">
                      <i class="fas fa-money-bill-wave me-2"></i> Cash
                    </mat-option>
                    <mat-option value="G-Pay">
                      <i class="fab fa-google-pay me-2"></i> G-Pay
                    </mat-option>
                    <mat-option value="PhonePe">
                      <i class="fas fa-mobile-alt me-2"></i> PhonePe
                    </mat-option>
                    <mat-option value="Bank Transfer">
                      <i class="fas fa-university me-2"></i> Bank Transfer
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-md-6">
                <mat-form-field class="w-100 modern-field" appearance="outline">
                  <mat-label>Payment Date</mat-label>
                  <input matInput [matDatepicker]="picker" [(ngModel)]="paymentDate">
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="selectedStudent && (!selectedStudent.dueDay || selectedStudent.dueDay.length === 0)" class="empty-state card border-0 bg-light text-center py-5 animate__animated animate__fadeIn">
          <div class="mb-3">
            <i class="fas fa-check-circle fa-4x text-success"></i>
          </div>
          <h5 class="fw-bold mb-2">All Fees Paid!</h5>
          <p class="text-muted mb-0">This student has no pending installments.</p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="dialog-footer mt-4 pt-4 border-top">
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-outline-secondary  py-2 rounded-3" (click)="close()">
            <i class="fas fa-times me-2"></i> Cancel
          </button>
          <button class="btn btn-gradient-primary  py-2 rounded-3 shadow-sm" 
                  [disabled]="!selectedDue || isSubmitting" 
                  (click)="submitPayment()">
            <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!isSubmitting" class="fas fa-check-circle me-2"></i>
            {{ isSubmitting ? 'Processing...' : 'Record Payment' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .record-payment-dialog { 
      padding: 10px; 
      min-width: 100% !important; 
      max-width: 100% !important;
    }

    .text-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .close-btn {
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f5f5f5;
      transform: rotate(90deg);
    }

    .modern-field {
      ::ng-deep .mat-mdc-form-field-focus-overlay {
        background: rgba(103, 126, 234, 0.05);
      }
    }

    .student-card {
      transition: all 0.3s ease;
      border-left: 4px solid #667eea !important;
    }

    .avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }

    .balance-box {
      min-width: 180px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .installment-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent !important;
    }

    .installment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    }

    .installment-card.selected {
      border-color: #667eea !important;
      background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
    }

    .installment-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .installment-card.selected .installment-icon {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .payment-form {
      border-left: 4px solid #667eea !important;
    }

    .btn-gradient-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-gradient-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(103, 126, 234, 0.4);
    }

    .btn-gradient-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .empty-state {
      animation: fadeIn 0.5s;
    }

    .animate__faster {
      --animate-duration: 0.5s;
    }

    ::ng-deep .modern-autocomplete .mat-mdc-option {
      padding: 12px 16px !important;
    }

    ::ng-deep .modern-autocomplete .mat-mdc-option:hover {
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%) !important;
    }
  `]
})
export class RecordPaymentDialogComponent implements OnInit {
  studentControl = new FormControl();
  allStudents: any[] = [];
  filteredStudents!: Observable<any[]>;
  selectedStudent: any = null;
  selectedDue: any = null;
  paymentMode = 'Cash';
  paymentDate = new Date();
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<RecordPaymentDialogComponent>,
    private api: AllApiService,
    private notify: MatSnackBar
  ) { }

  ngOnInit() {
    this.api.getAllStudents().subscribe(res => {
      this.allStudents = res.responseObject || [];
    });

    this.filteredStudents = this.studentControl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.fullName),
      map(name => name ? this._filter(name) : this.allStudents.slice(0, 10))
    );
  }

  private _filter(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.allStudents.filter(s =>
      s.fullName.toLowerCase().includes(filterValue) ||
      s.studentID.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  displayFn(student: any): string {
    return student ? student.fullName : '';
  }

  onStudentSelected(student: any) {
    this.selectedStudent = student;
    this.selectedDue = this.getPendingDues()[0] || null;
  }

  getPendingDues() {
    return (this.selectedStudent?.dueDay || []).filter((d: any) => d.status === 'Not Paid' || d.status === 'Pending');
  }

  selectDue(due: any) {
    this.selectedDue = due;
  }

  submitPayment() {
    if (!this.selectedDue || !this.selectedStudent) return;

    this.isSubmitting = true;
    this.api.makeStudentPayment(
      this.selectedDue.id,
      'Paid',
      this.selectedStudent.id,
      this.paymentMode,
      this.paymentDate.toISOString()
    ).subscribe({
      next: (res) => {
        this.notify.open('✓ Payment recorded successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notify.open('✗ Failed to record payment. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
