import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { adminGuard } from './guards/admin.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'login-creation',
    loadComponent: () =>
      import('./layouts/login-creation/login-creation.component').then(
        (m) => m.LoginCreationComponent
      ),
  },
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivateChild: [permissionGuard],
    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ), data: { ssr: false }
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./layouts/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'lead',
        loadComponent: () =>
          import('./admin/lead/lead.component').then((m) => m.LeadComponent),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./admin/students/students.component').then(
            (m) => m.StudentsComponent
          ),
      },
      {
        path: 'students-attendance',
        loadComponent: () =>
          import(
            './admin/student-attendance/student-attendance.component'
          ).then((m) => m.StudentAttendanceComponent),
      },
      {
        path: 'fees',
        loadComponent: () =>
          import('./admin/fees/fees.component').then((m) => m.FeesComponent),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./staff/staff-manage/staff-manage.component').then(
            (m) => m.StaffManageComponent
          ),
      },
      {
        path: 'staff-task',
        loadComponent: () =>
          import('./staff/staff-task/staff-task.component').then(
            (m) => m.StaffTaskComponent
          ),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./admin/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
        canActivate: [adminGuard],
      },
    ],
  },
];
