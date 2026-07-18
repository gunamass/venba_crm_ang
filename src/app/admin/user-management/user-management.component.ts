import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-user-management',
    imports: [SharedCommonModule],
    templateUrl: './user-management.component.html',
    styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
    users: any[] = [];
    staffList: any[] = [];
    isModalOpen = false;
    isEditMode = false;
    selectedUserId: string | null = null;
    userForm: FormGroup;
    roles = ['ADMIN', 'MANAGER', 'STAFF'];
    availableRoutes = [
        { key: '/dashboard', label: 'Dashboard' },
        { key: '/lead', label: 'Lead Management' },
        { key: '/students', label: 'Student Management' },
        { key: '/staff-task', label: 'Task Management' },
        { key: '/settings', label: 'Settings' },
        { key: '/staff', label: 'Staff Management' },
        { key: '/user-management', label: 'User Management' },
        { key: '/fees', label: 'Fees' },
        { key: '/students-attendance', label: 'Student Attendance' },
    ];

    constructor(
        private fb: FormBuilder,
        private api: AllApiService,
        private notify: MatSnackBar,
        public auth: AuthService
    ) {
        this.userForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
            role: ['', Validators.required],
            staffId: [''],
            enabled: [true],
            allowedRoutes: [[]],
        });
    }

    ngOnInit(): void {
        this.loadStaff();
        this.loadUsers();
    }

    loadStaff() {
        this.api.getAllStaffAndIds().subscribe({
            next: (res) => {
                this.staffList = res.responseObject || [];
            },
            error: (err) => console.log(err)
        });
    }

    loadUsers() {
        this.api.getAllUsers().subscribe({
            next: (res) => {
                this.users = (res.responseObject || []).map((u: any) => {
                    const staffId = u.staffId || u.staff_id;
                    const staff = this.staffList.find(s => s.id === staffId);
                    return {
                        ...u,
                        staffName: staff?.name || staff?.username || null,
                        displayRoutes: this.normalizeAllowedRoutes(u.allowedRoutes || u.allowed_routes || []),
                    };
                });
            },
            error: (err) => {
                console.log(err);
                this.notify.open('Unable to load users');
            }
        });
    }

    openModal(mode: 'create' | 'edit' = 'create', user?: any) {
        this.isEditMode = mode === 'edit';
        this.selectedUserId = user?.id || null;
        this.userForm.reset({
            username: user?.username || '',
            password: '',
            role: user?.role || '',
            staffId: user?.staffId || user?.staff_id || '',
            enabled: user?.enabled !== false,
            allowedRoutes: this.normalizeAllowedRoutes(user?.allowedRoutes || user?.allowed_routes || []),
        });

        if (this.isEditMode) {
            this.userForm.get('password')?.clearValidators();
            this.userForm.get('password')?.setValue('');
        } else {
            this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        }
        this.userForm.get('password')?.updateValueAndValidity();
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.isEditMode = false;
        this.selectedUserId = null;
        this.userForm.reset({
            username: '',
            password: '',
            role: '',
            staffId: '',
            enabled: true,
            allowedRoutes: [],
        });
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('password')?.updateValueAndValidity();
    }

    toggleRoute(routeKey: string, checked: boolean) {
        const current = this.userForm.get('allowedRoutes')?.value || [];
        const next = checked
            ? Array.from(new Set([...current, routeKey]))
            : current.filter((route: string) => route !== routeKey);
        this.userForm.get('allowedRoutes')?.setValue(next);
    }

    isRouteSelected(routeKey: string): boolean {
        return (this.userForm.get('allowedRoutes')?.value || []).includes(routeKey);
    }

    saveUser() {
        if (this.userForm.invalid) {
            this.notify.open('Please fill in all required fields');
            return;
        }

        const payload = { ...this.userForm.value };
        payload.allowedRoutes = payload.allowedRoutes || [];
        if (this.isEditMode && !payload.password) {
            delete payload.password;
        }

        const request = this.isEditMode && this.selectedUserId
            ? this.api.updateUserAccount(this.selectedUserId, payload)
            : this.api.createUserAccount(payload);

        request.subscribe({
            next: () => {
                this.notify.open(this.isEditMode ? 'User updated successfully' : 'User created successfully', '', { duration: 3000 });
                this.closeModal();
                this.loadUsers();
            },
            error: (err) => {
                this.notify.open(err.error?.message || err.error?.error || 'Error saving user');
            }
        });
    }

    deleteUser(user: any) {
        if (!user?.id) return;
        if (!confirm(`Delete user ${user.username}?`)) return;

        this.api.deleteUserAccount(user.id).subscribe({
            next: () => {
                this.notify.open('User deleted successfully');
                this.loadUsers();
            },
            error: (err) => {
                this.notify.open(err.error?.message || 'Error deleting user');
            }
        });
    }

    private normalizeAllowedRoutes(routes: any): string[] {
        if (!routes) return [];
        if (Array.isArray(routes)) return routes;
        if (typeof routes === 'string') {
            try { const parsed = JSON.parse(routes); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
        }
        return [];
    }
}
