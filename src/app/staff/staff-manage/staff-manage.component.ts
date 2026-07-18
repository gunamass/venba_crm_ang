import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiService } from '../../services/all-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../layouts/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-manage',
  imports: [SharedCommonModule],
  templateUrl: './staff-manage.component.html',
  styleUrl: './staff-manage.component.scss',
})
export class StaffManageComponent implements OnInit {
  staffStats = {
    total: 0,
    activeTasks: 0,
    conversions: 0,
    performance: 0,
  };

  searchQuery = '';
  selectedRole = '';
  staffTablePopup = false;
  selectedStaff: any


  isStaffModalOpen = false;
  isEditMode = false;
  isViewOnly = false;

  roles: string[] = [];
  departments = ['HR', 'Academics', 'Finance', 'IT'];

  staffDataSource = new MatTableDataSource<any>([])

  staffForm!: FormGroup;
  constructor(private fb: FormBuilder,
    private api: AllApiService,
    private notify: MatSnackBar,
    private dialog: MatDialog,
    public auth: AuthService
  ) {
    this.staffForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      role: ['', Validators.required],
      email: ['', Validators.required],
      phone_no: ['', Validators.required],
      department: ['', Validators.required],
      joining_date: ['', Validators.required],
      // userId: [''],
      id_proof: ['', Validators.required],
      proof_no: ['', Validators.required],
      // type: ['']
    });
  }

  ngOnInit(): void {
    this.getAllStaff();
    this.getDropDowns();
    this.setupFilterPredicate();
  }

  setupFilterPredicate() {
    this.staffDataSource.filterPredicate = (data: any, filter: string): boolean => {
      if (!filter) return true;
      try {
        const searchTerms = JSON.parse(filter);
        const name = (data.name || '').toLowerCase();
        const search = (searchTerms.search || '').toLowerCase();
        const matchesName = name.includes(search);

        const dataRole = (data.role || '').toLowerCase();
        const filterRole = (searchTerms.role || '').toLowerCase();
        const matchesRole = filterRole ? dataRole === filterRole : true;

        return matchesName && matchesRole;
      } catch (e) {
        return true;
      }
    };
  }

  getDropDowns() {
    this.api.getAllDropDown().subscribe({
      next: (res) => {
        const roleDrop = res.responseObject.find((d: any) => d.dropdownType === 'role');
        if (roleDrop && roleDrop.values) {
          this.roles = roleDrop.values;
        }
      },
      error: (err) => console.log(err)
    });
  }

  getAllStaff() {
    this.api.getAllStaff().subscribe({
      next: (res) => {
        this.staffDataSource.data = res.responseObject;
        this.calculateStats();
        this.applyCombinedFilter();
      },
      error: (err) => console.log(err)
    })
  }

  calculateStats() {
    const data = this.staffDataSource.data;
    const totalTasks = data.reduce((acc, s) => acc + (s.taskManagementDTOS?.length || 0), 0);
    const completedTasks = data.reduce((acc, s) => acc + (s.taskManagementDTOS?.filter((t: any) => t.status === 'Completed').length || 0), 0);

    this.staffStats = {
      total: data.length,
      activeTasks: totalTasks - completedTasks,
      conversions: data.reduce((acc, s) => acc + (s.conversions || 0), 0),
      performance: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  openStaffModal(mode: 'add' | 'edit' | 'view' = 'add', staff?: any) {
    this.isEditMode = mode === 'edit';
    this.isViewOnly = mode === 'view';
    this.isStaffModalOpen = true;

    if (staff) {
      // Map API response fields to form fields
      const mappedData = {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        email: staff.email,
        phone_no: staff.phone_no || staff.phoneNo || staff.phoneNumber,
        department: staff.department,
        joining_date: staff.joining_date || staff.joiningDate,
        id_proof: staff.id_proof || staff.idProof,
        proof_no: staff.proof_no || staff.proofNo,
      };
      this.staffForm.patchValue(mappedData);
      if (this.isViewOnly) {
        this.staffForm.disable();
      } else {
        this.staffForm.enable();
      }
    } else {
      this.staffForm.reset();
      this.staffForm.enable();
    }
  }

  closeStaffModal() {
    this.isStaffModalOpen = false;
    this.isEditMode = false;
    this.isViewOnly = false;
    this.staffForm.reset();
    this.staffForm.enable();
  }

  addStaffMember() {
    if (this.staffForm.invalid) {
      this.notify.open('Please fill all required fields', '', { duration: 1500 });
    }

    const payLoad = this.staffForm.getRawValue();

    const request = this.isEditMode
      ? this.api.updateStaff(payLoad.id, payLoad)
      : this.api.addStaff(payLoad);

    request.subscribe({
      next: (res) => {
        this.closeStaffModal();
        this.getAllStaff();
        this.notify.open(this.isEditMode ? 'Staff Updated Successfully' : 'Staff Added Successfully', '', { duration: 1500 });
      },
      error: (err) => {
        this.notify.open(err.error?.responseMessage || 'Error processing request', '', { duration: 1500 });
      }
    });
  }

  exportToCSV() {
    const data = this.staffDataSource.filteredData || this.staffDataSource.data;
    if (data.length === 0) return;

    const headers = ['Name', 'Role', 'Email', 'Phone', 'Department', 'Joined'];
    const rows = data.map(s => [
      s.name, s.role, s.email, s.phoneNo, s.department, s.joiningDate
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `staff_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteStaff(id: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Staff',
        message: 'Are you sure you want to delete this staff member?',
        confirmText: 'Delete',
        confirmColor: 'warn'
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.api.deleteStaff(id).subscribe(
          (res) => {
            this.notify.open('Staff deleted successfully', '', { duration: 1500 });
            this.getAllStaff();
          },
          (err) => console.log(err)
        );
      }
    });
  }


  applyCombinedFilter() {
    const filterValues = {
      search: this.searchQuery.trim().toLowerCase(),
      role: this.selectedRole
    };

    this.staffDataSource.filter = JSON.stringify(filterValues);
  }

  viewStaff(el: any) {
    console.log(el);
    this.staffForm.patchValue(el)
    this.staffForm.disable()

    this.openStaffModal()

  }

  openStaffTable(el: any) {
    this.staffTablePopup = true;
    document.body.classList.add('modal-open');
    this.selectedStaff = el
  }

  getActiveTaskCount(staff: any): number {
    if (!staff?.taskManagementDTOS) return 0;
    return staff.taskManagementDTOS.filter((t: any) =>
      t.status !== 'Completed' && t.status !== 'Submitted'
    ).length;
  }

  getCompletedTaskCount(staff: any): number {
    if (!staff?.taskManagementDTOS) return 0;
    return staff.taskManagementDTOS.filter((t: any) => t.status === 'Completed').length;
  }

  getPerformanceRate(staff: any): number {
    if (!staff?.taskManagementDTOS || staff.taskManagementDTOS.length === 0) return 0;
    const completed = this.getCompletedTaskCount(staff);
    return Math.round((completed / staff.taskManagementDTOS.length) * 100);
  }

  closeStaffTable() {
    this.staffTablePopup = false;
    document.body.classList.remove('modal-open');
  }

}
