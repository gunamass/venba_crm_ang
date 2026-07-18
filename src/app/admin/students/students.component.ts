import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { MatTableDataSource } from '@angular/material/table';
import { AllApiService } from '../../services/all-api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../services/storage.service';
import { BToastService } from '../../services/b-toast.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../layouts/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-students',
  imports: [SharedCommonModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
})
export class StudentsComponent implements OnInit {
  searchTerm = '';
  selectedCourse = '';
  selectedStatus = '';

  emiEnabled: boolean = false;

  totalStudents: any = 0;
  activeStudents: any = 0;
  feeCollected: any = 0;
  outStandingFee: any = 0;

  studentsDataSource = new MatTableDataSource<any>([]);
  filterStorage: any = [];

  isMailModalOpen = false



  logger() {
    console.log(this.emiEnabled);
    this.studentForm.get('emiEnabled')?.setValue('true')
  }

  courses: string[] = [];

  getAllStudents() {
    this.api.getAllStudents().subscribe(async (res) => {
      this.studentsDataSource.data = res.responseObject;
      this.filterStorage = this.studentsDataSource.data;
      this.calculateStudentStats(this.studentsDataSource.data);
    }),
      (err: any) => console.log(err);
  }

  calculateStudentStats(students: any[]) {
    debugger
    this.totalStudents = students.length;

    this.activeStudents = students.filter(s => s.status === 'Active');

    this.feeCollected = students.reduce((sum, s) => {
      const initial = Number(s.initialAmt) || 0;
      const paidDues = (s.dueDay || [])
        .filter((d: any) => d.status === 'Paid')
        .reduce((dSum: number, d: any) => dSum + Number(d.dueAmt || 0), 0);
      return sum + initial + paidDues;
    }, 0);

    this.outStandingFee = this.activeStudents.reduce((sum: any, s: any) => sum + Number(s?.balanceFee || 0), 0);

  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCourse = '';
    this.selectedStatus = '';
    this.studentsDataSource.data = this.filterStorage
  }

  isStudentModalOpen = false;
  studentForm: FormGroup;
  dueDates: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: AllApiService,
    private notify: MatSnackBar,
    private storeApi: StorageService,
    private toast: BToastService,
    public auth: AuthService,
    private dialog: MatDialog
  ) {
    this.studentForm = this.fb.group({
      id: [''],
      batch: [''],
      fullName: ['', Validators.required],
      status: [''],
      studentID: ['', Validators.required],
      classCount: ['', Validators.required],

      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      course: ['', Validators.required],
      classStartDate: ['', Validators.required],
      classEndDate: ['', Validators.required],
      totalFee: [0, Validators.required],
      initialAmt: [''],
      balanceFee: [''],
      emiEnabled: ['false'],
      split: [0],
      shift: ['Morning'],
      startTime: [''],
      endTime: [''],

      // dueDay: [''],
      dueDay: this.fb.control([]),
      attendance: this.fb.control([]),
    });

    // auto update balance when total/initial changes
    this.studentForm.valueChanges.subscribe((val) => {
      this.studentForm.patchValue(
        { balanceFee: val.totalFee - val.initialAmt },
        { emitEvent: false }
      );
    });
  }

  ngOnInit(): void {
    this.getAllStudents();
    this.getDropDowns();
  }

  getDropDowns() {
    this.api.getAllDropDown().subscribe({
      next: (res) => {
        const courseDrop = res.responseObject.find((d: any) => d.dropdownType === 'course');
        if (courseDrop && courseDrop.values) {
          this.courses = courseDrop.values;
        }
      },
      error: (err) => console.log(err)
    });
  }

  closeStudentModal() {
    this.isStudentModalOpen = false;
  }

  updateDueDates() {
    const val = this.studentForm.value;

    if (
      !val.split ||
      val.balanceFee <= 0 ||
      !val.classStartDate ||
      !val.classEndDate
    ) {
      this.dueDates = [];

      this.notify.open('Give All Required Field', 'warning', {
        verticalPosition: 'top',
        horizontalPosition: 'right',
        duration: 1500,
        panelClass: ['sb-w'],
      });

      return;
    }

    if (val.split > val.balanceFee) {
      this.notify.open(
        'Split count cannot be greater than balance fee',
        'warning',
        {
          verticalPosition: 'top',
          horizontalPosition: 'right',
          duration: 1500,
          panelClass: ['sb-w'],
        }
      );

      return;
    }

    const start = new Date(val.classStartDate);
    const end = new Date(val.classEndDate);

    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
    );

    const interval = Math.floor(diffDays / val.split);

    const baseAmount = Math.floor(val.balanceFee / val.split);
    const remainder = val.balanceFee % val.split;

    this.dueDates = [];

    for (let i = 0; i < val.split; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(start.getDate() + i * interval);

      const currentAmount =
        i === val.split - 1
          ? baseAmount + remainder
          : baseAmount;

      this.dueDates.push({
        dueNo: i + 1,
        dueAmt: currentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'Not Paid',
      });
    }

    console.log(this.dueDates);
  }

  enrollmentKey: boolean = false;
  openDialog(type: any, el?: any) {
    this.isStudentModalOpen = !this.isStudentModalOpen;
    this.studentForm.reset();
    if (type == 'new') {
      this.enrollmentKey = false;
    } else if (type == 'enroll' && el) {
      this.enrollmentKey = true;
      this.student = el
      this.studentForm.patchValue(el);
    } else {
      console.log('err');
    }
  }

  AddNewStudent() {
    this.studentForm.get('status')?.setValue('Inactive');
    this.studentForm.get('balanceFee')?.setValue('0');
    this.studentForm.get('initialAmt')?.setValue('0');
    this.studentForm.get('split')?.setValue('0');
    this.studentForm.get('totalFee')?.setValue('0');
    this.studentForm.get('emiEnabled')?.setValue('false');
    this.studentForm
      .get('studentID')
      ?.setValue(
        `${this.studentForm.get('batch')?.value.toUpperCase()}${this.studentsDataSource.data.length + 1
        }`
      );
    debugger
    let payLoad = this.studentForm.getRawValue()
    payLoad.balanceFee = String(payLoad.balanceFee)
    this.api.createStudents(payLoad).subscribe(
      async (res) => {
        this.notify.open('Studented Created', 'success', {
          verticalPosition: 'top',
          horizontalPosition: 'right',
          duration: 1500,
          panelClass: ['sb-w'],
        });
        this.isStudentModalOpen = !this.isStudentModalOpen;
        this.getAllStudents();
        this.studentForm.reset();
      },
      (err) => {
        console.log(err)
        this.notify.open(`${err.error.responseMessage}`, 'Failed', {
          verticalPosition: 'top',
          horizontalPosition: 'right',
          duration: 1500,
          panelClass: ['sb-w'],
        });
      }
    );
    console.log(this.studentForm.value);
  }

  attendance: any;

  enrollStudent() {
    this.studentForm
      .get('status')
      ?.setValue('Active');
    this.studentForm.get('attendance')?.setValue(this.attendance)
    this.studentForm.get('dueDay')?.setValue(this.dueDates)
    this.studentForm.get('studentID')?.setValue(`${this.studentForm.get('batch')?.value}${this.studentsDataSource.data.length}`)
    console.log(this.studentForm.value);

    this.api
      .enrollStudent(this.studentForm.value)
      .subscribe({
        next: (res) => {
          console.log('✅ Updated:');
          this.getAllStudents();
          this.isStudentModalOpen = !this.isStudentModalOpen;
          this.notify.open(res.responseObject.responseMessage, 'warning', {
            verticalPosition: 'top',
            horizontalPosition: 'right',
            duration: 1500,
            panelClass: ['sb-w'],
          });
        },
        error: (err) => console.error('❌ Error updating student:', err),
      });
  }

  // applyFilters(): void {
  //   console.log(this.searchTerm);

  //   if (this.searchTerm == '') {
  //     this.studentsDataSource.data = this.filterStorage;
  //   } else {
  //     this.studentsDataSource.data = this.studentsDataSource.data.filter((s) => {
  //       const matchesSearch =
  //         s.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
  //         s.phoneNumber.includes(this.searchTerm);
  //       return matchesSearch
  //     });
  //   }
  // }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      this.studentsDataSource.data = this.filterStorage;
      return;
    }

    this.studentsDataSource.data = this.filterStorage.filter((s: any) => {
      const fullName = s.fullName?.toLowerCase() || '';
      const phone = s.phoneNumber?.toLowerCase() || '';
      const email = s.email?.toLowerCase() || '';
      const batch = s.batch?.toLowerCase() || '';
      const course = s.course?.toLowerCase() || '';

      return (
        fullName.includes(search) ||
        phone.includes(search) ||
        email.includes(search) ||
        batch.includes(search) ||
        course.includes(search)
      );
    });
  }

  courseFilters() {
    this.studentsDataSource.data = this.filterStorage;

    if (this.selectedCourse) {
      this.studentsDataSource.data = this.studentsDataSource.data.filter((s) => {
        const matchesCourse = this.selectedCourse
          ? s.course == this.selectedCourse
          : true;

        return matchesCourse;
      });
    }
  }

  statusFilters() {
    this.studentsDataSource.data = this.filterStorage;

    if (this.selectedStatus) {
      this.studentsDataSource.data = this.studentsDataSource.data.filter((s) => {
        const matchesStatus = this.selectedStatus
          ? s.status == this.selectedStatus
          : true;
        return matchesStatus;
      });
    }
  }

  saveStudent() {
    const student = {
      ...this.studentForm.value,
      Fees: { ...this.studentForm.value, dueDates: this.dueDates },
    };
    this.closeStudentModal();
  }

  isStudenOverViewOpen = false;
  activeTab: string = 'overview';
  selectedStudentOverview: any;

  openOverViewModal(el: any) {
    this.isStudenOverViewOpen = true;
    this.activeTab = 'overview';
    this.selectedStudentOverview = el;

    // Add isLocked property to attendance records for UI freezing
    if (this.selectedStudentOverview.attendance) {
      this.selectedStudentOverview.attendance.forEach((r: any) => {
        r.isLocked = r.attend && r.attend !== 'none';
      });
    }
  }

  closeOverViewModal() {
    this.isStudenOverViewOpen = false;
  }

  makePayment(due: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Payment',
        message: `Are you sure you want to mark payment of ₹${due.dueAmt} as paid?`,
        confirmText: 'Mark Paid',
        confirmColor: 'primary'
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.api.makeStudentPayment(due.id, 'Paid', this.selectedStudentOverview.id, 'cash', new Date()).subscribe({
          next: (res) => {
            console.log('Payment updated successfully');
            this.notify.open(`${res.responseMessage}`, 'success')
            this.closeOverViewModal()
            this.getAllStudents()
          },
          error: (err) => {
            this.notify.open(`${err.error.message}`, 'failed')
          },
        });
      }
    });
  }

  attendanceCategory: 'weekend' | 'weekday' = 'weekend';
  selectedWeekdays: string[] = [];
  attendanceDates: { date: string; day: string }[] = [];

  student: any

  weekdaysMap: { [key: string]: number } = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  get availableDays(): string[] {
    return this.attendanceCategory === 'weekend'
      ? ['Saturday', 'Sunday']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }

  toggleWeekday(day: string, event: any) {
    if (event.target.checked) {
      this.selectedWeekdays.push(day);
    } else {
      this.selectedWeekdays = this.selectedWeekdays.filter((d) => d !== day);
    }
  }

  resetSelectedDays() {
    this.selectedWeekdays = [];
    console.log(this.attendanceCategory);
  }

  generateAttendanceDates(
    startDate: string,
    endDate: string,
    numberOfClasses: number,
    selectedWeekdays: string[]
  ): { date: string; day: string; attend: string }[] {
    // Validation checks
    if (
      !startDate ||
      !endDate ||
      !numberOfClasses ||
      numberOfClasses <= 0 ||
      !selectedWeekdays ||
      selectedWeekdays.length === 0
    ) {
      this.notify.open('Give All Required Field', 'warning', {
        verticalPosition: 'top',
        horizontalPosition: 'right',
        duration: 1500,
        panelClass: ['sb-w'],
      });
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Invalid date range check
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      this.notify.open('Invalid date range', 'warning', {
        verticalPosition: 'top',
        horizontalPosition: 'right',
        duration: 1500,
        panelClass: ['sb-w'],
      });
      return [];
    }

    const result: { date: string; day: string; attend: string }[] = [];
    const selectedDays = selectedWeekdays.map((day) => this.weekdaysMap[day]);

    // Collect all possible valid dates first
    const allValidDates: Date[] = [];
    let current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (selectedDays.includes(day)) {
        allValidDates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    if (allValidDates.length === 0) {
      this.notify.open('No matching weekdays found in range', 'warning', {
        verticalPosition: 'top',
        horizontalPosition: 'right',
        duration: 1500,
        panelClass: ['sb-w'],
      });
      return [];
    }

    // If total possible dates < numberOfClasses → take all
    if (allValidDates.length <= numberOfClasses) {
      allValidDates.forEach((d) =>
        result.push({
          date: d.toISOString().split('T')[0],
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
          attend: 'none',
        })
      );
    } else {
      // Spread out evenly across available dates
      const step = Math.floor(allValidDates.length / numberOfClasses);
      for (let i = 0; i < numberOfClasses; i++) {
        const d = allValidDates[i * step];
        result.push({
          date: d.toISOString().split('T')[0],
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
          attend: 'none',
        });
      }
    }

    this.attendance = result;
    return result;
  }

  isMatch = (record: any) => ['Present', 'LPresent'].includes(record.attend);
  onGenerateAttendance() {

    const { classStartDate, classEndDate, classCount } = this.studentForm.value;

    console.log('Form Values:', this.studentForm.value);
    console.log(classStartDate, classEndDate, classCount, this.selectedWeekdays);

    this.attendanceDates = this.generateAttendanceDates(
      classStartDate,
      classEndDate,
      classCount,
      this.selectedWeekdays
    );
  }
  attendanceOptions = ['Present', 'Absent', 'LPresent'];

  markAttendance(record: any) {
    if (record.attend === 'none') {
      this.notify.open('Please select an attendance status first', 'warning', {
        verticalPosition: 'top',
        horizontalPosition: 'right',
        duration: 1500,
        panelClass: ['sb-w'],
      });
      return;
    }


    this.api.makeStudentAttendance(record.id, record.attend).subscribe({
      next: (res) => {
        console.log();
        this.notify.open('Attendance updated successfully', 'success', {
          verticalPosition: 'top',
          horizontalPosition: 'right',
          duration: 1500,
          panelClass: ['sb-success'],
        });
        this.closeOverViewModal()
        this.getAllStudents()

      },
      error: (err) => {
        this.notify.open(`${err.error.message}`, 'fail', {
          verticalPosition: 'top',
          horizontalPosition: 'right',
          duration: 1500,
          panelClass: ['sb-success'],
        });
      },
    })


  }


  closeMailModal() {
    this.isMailModalOpen = !this.isMailModalOpen
  }

  openMailModal(s: any) {
    this.mailData.receiver = s
    this.closeMailModal()
    console.log(this.mailData);

  }

  mailData = {
    receiver: "",
    message: "",
    subject: ''
  };

  sendMailToClient() {
    if (!this.mailData.message && !this.mailData.receiver && !this.mailData.subject) return this.toast.show({ type: 'warn', message: 'Compose a mail!' })

    this.api.sendMailToClient(this.mailData).subscribe({
      next: (res) => {
        this.closeMailModal();
        this.mailData = { receiver: "", message: "", subject: '' };
        this.toast.show({ type: 'success', message: 'Mail Sent Successfully!' })
      },
      error: (err) => {
        this.toast.show({ type: 'error', message: 'Error sending mail!' })
        console.error(err);
      }
    });
  }

  exportToExcel() {
    const data = this.studentsDataSource.filteredData || this.studentsDataSource.data;
    if (data.length === 0) {
      this.notify.open('No data to export', '', { duration: 1500 });
      return;
    }

    const headers = ['Student Name', 'Student ID', 'Email', 'Phone', 'Course', 'Batch', 'Shift', 'Start Date', 'End Date', 'Total Fee', 'Balance Fee', 'Status'];
    const rows = data.map(s => [
      s.fullName,
      s.studentID,
      s.email,
      s.phoneNumber,
      s.course || '-',
      s.batch || '-',
      s.shift || '-',
      s.classStartDate || '-',
      s.classEndDate || '-',
      s.Fees?.totalFee || 0,
      s.Fees?.balanceFee || 0,
      s.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.open('Excel report downloaded successfully', '', { duration: 1500 });
  }



}
