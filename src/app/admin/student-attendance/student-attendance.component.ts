import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../services/storage.service';
import { MatTableDataSource } from '@angular/material/table';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.css'],
  imports: [SharedCommonModule, NgChartsModule],
})
export class StudentAttendanceComponent implements OnInit {
  studentsDataSource = new MatTableDataSource<any>([]);
  filterStorage: any = [];
  isStudentPreview = false;

  classes: string[] = [];
  courses: string[] = [];

  searchText = '';
  selectedClass = '';
  selectedCourse = '';
  constructor(
    private api: AllApiService,
    private notify: MatSnackBar,
    private storeApi: StorageService
  ) { }

  ngOnInit() {
    this.getAllStudents();
    this.getTodayAttendance();
  }
  // Add these rules inside your component class
  isMatch = (record: any) => ['Present', 'LPresent'].includes(record.attend);
  isAbsent = (record: any) => record.attend === 'Absent';
  isLate = (record: any) => record.attend === 'LPresent';
  isNone = (record: any) => record.attend === 'none';

  getAllStudents() {
    this.api.getAllStudents().subscribe(
      (res) => {
        const data = res.responseObject || [];
        this.studentsDataSource.data = data;
        this.filterStorage = data;
        this.totalStudents = data.length;

        // Reset today's stats for re-calculation
        this.presentToday = 0;
        this.absentToday = 0;
        this.lateToday = 0;

        this.studentsDataSource.data.forEach((s: any) => {
          if (s.attendance) {
            s.Atsummary = this.storeApi.calculateAttendanceSummary(
              s.attendance
            );

            // Calculate today's stats
            const todayRecord = s.attendance.find((a: any) => a.date === this.today);
            if (todayRecord) {
              if (todayRecord.attend === 'Present') this.presentToday++;
              else if (todayRecord.attend === 'Absent') this.absentToday++;
              else if (todayRecord.attend === 'LPresent') this.lateToday++;
            }
          } else {
            s.Atsummary = { present: 0, absent: 0, late: 0, none: 0 };
          }
        });

        // Calculate Average Attendance Percentage across all students
        const allPresent = data.reduce((acc: number, s: any) => acc + (s.Atsummary?.present || 0), 0);
        const allExpected = data.reduce((acc: number, s: any) => acc + (s.classCount || 0), 0);
        this.avgAttendance = allExpected > 0 ? Math.round((allPresent / allExpected) * 100) : 0;

        // Dynamic classes and courses from data
        this.classes = [...new Set(data.map((s: any) => s.shift))].filter(Boolean) as string[];
        this.courses = [...new Set(data.map((s: any) => s.course))].filter(Boolean) as string[];

        this.calculateClassWiseStats();
        this.refreshRecords();
        this.updateCharts();

        // Now load today's attendance for the marker
        this.getTodayAttendance();
      },
      (err: any) => console.error(err)
    );
  }

  studentsToday = new MatTableDataSource<any>([]);

  today = new Date().toISOString().split('T')[0]; // "2025-09-13"
  getTodayAttendance() {
    this.studentsToday.data = this.studentsDataSource.data
      .filter((student: any) =>
        student.attendance?.some((a: any) => a.date === this.today)
      )
      .map((student: any) => {
        const todayRecord = student.attendance.find(
          (a: any) => a.date === this.today
        );

        return {
          id: student.id,
          fullName: student.fullName,
          studentID: student.studentID,
          course: student.course,
          todayAttendance: {
            ...todayRecord,
            isLocked: todayRecord.attend && todayRecord.attend !== 'none'
          },
        };
      });
  }


  totalStudents = 0;
  presentToday = 0;
  absentToday = 0;
  lateToday = 0;
  avgAttendance = 85;

  classWise: any[] = [];
  lowAttendanceAlert: any = null;

  // Chart Properties
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{ data: [11, 20, 30], backgroundColor: ['#28a745', '#dc3545', '#ffc107'] }]
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Attendance %', borderColor: '#6f42c1', tension: 0.4, fill: true, backgroundColor: 'rgba(111, 66, 193, 0.1)' }
    ]
  };
  public lineChartType: ChartType = 'line';
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, max: 100 } }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Avg Attendance %', backgroundColor: '#3385ff' }
    ]
  };
  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } }
  };

  updateCharts() {
    // Doughnut Chart Data
    this.doughnutChartData = {
      ...this.doughnutChartData,
      datasets: [{
        ...this.doughnutChartData.datasets[0],
        data: [this.presentToday, this.absentToday, this.lateToday]
      }]
    };

    // Line Chart Data (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const percentages = last7Days.map(date => {
      let total = 0;
      let present = 0;
      this.filterStorage.forEach((s: any) => {
        const record = s.attendance?.find((a: any) => a.date === date);
        if (record) {
          total++;
          if (record.attend === 'Present' || record.attend === 'LPresent') present++;
        }
      });
      return total > 0 ? Math.round((present / total) * 100) : 0;
    });

    this.lineChartData = {
      labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })),
      datasets: [{ ...this.lineChartData.datasets[0], data: percentages }]
    };

    // Bar Chart Data (Course-wise)
    const courseStats = new Map<string, { total: number, present: number }>();
    this.filterStorage.forEach((s: any) => {
      const course = s.course || 'Other';
      if (!courseStats.has(course)) courseStats.set(course, { total: 0, present: 0 });
      const stats = courseStats.get(course)!;
      stats.total += (s.classCount || 0);
      stats.present += (s.Atsummary?.present || 0);
    });

    this.barChartData = {
      labels: Array.from(courseStats.keys()),
      datasets: [{
        ...this.barChartData.datasets[0],
        data: Array.from(courseStats.values()).map(s => s.total > 0 ? Math.round((s.present / s.total) * 100) : 0)
      }]
    };
  }

  applyFilters() {
    let filtered = [...this.filterStorage];

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.fullName?.toLowerCase().includes(search) ||
        s.studentID?.toLowerCase().includes(search)
      );
    }

    if (this.selectedClass) {
      filtered = filtered.filter(s => s.shift === this.selectedClass);
    }

    if (this.selectedCourse) {
      filtered = filtered.filter(s => s.course === this.selectedCourse);
    }

    this.studentsDataSource.data = filtered;
  }

  calculateClassWiseStats() {
    const classMap = new Map<string, { total: number, present: number }>();

    this.filterStorage.forEach((s: any) => {
      const className = s.shift || 'Other';
      if (!classMap.has(className)) {
        classMap.set(className, { total: 0, present: 0 });
      }
      const stats = classMap.get(className)!;
      stats.total += (s.classCount || 0);
      stats.present += (s.Atsummary?.present || 0);
    });

    this.classWise = Array.from(classMap.entries()).map(([name, stats]) => ({
      name: name + ' Batch',
      percent: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
    }));

    // Find student with lowest attendance percentage
    const lowest = [...this.filterStorage]
      .filter(s => s.classCount > 0)
      .sort((a, b) => {
        const percA = (a.Atsummary?.present || 0) / a.classCount;
        const percB = (b.Atsummary?.present || 0) / b.classCount;
        return percA - percB;
      })[0];

    if (lowest) {
      this.lowAttendanceAlert = {
        name: lowest.fullName,
        percent: Math.round((lowest.Atsummary?.present || 0) / lowest.classCount * 100)
      };
    }
  }

  refreshRecords() {
    const allRecords: any[] = [];
    this.filterStorage.forEach((s: any) => {
      if (s.attendance) {
        s.attendance.forEach((a: any) => {
          allRecords.push({
            name: s.fullName,
            id: s.id,
            date: a.date,
            time: s.startTime || '-',
            class: s.shift + ' Batch',
            course: s.course,
            status: a.attend === 'LPresent' ? 'Late' : (a.attend || 'none'),
            markedBy: 'System'
          });
        });
      }
    });

    // Sort by date descending
    this.attendanceRecords = allRecords.sort((a, b) => b.date.localeCompare(a.date));
    this.applyRecordFilters();
  }

  filteredAttendanceRecords: any[] = [];
  applyRecordFilters() {
    let filtered = [...this.attendanceRecords];

    if (this.recordSearch) {
      const search = this.recordSearch.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(search));
    }

    if (this.selectedDate) {
      filtered = filtered.filter(r => r.date === this.selectedDate);
    }

    if (this.recordClass) {
      filtered = filtered.filter(r => r.class === this.recordClass);
    }

    if (this.recordCourse) {
      filtered = filtered.filter(r => r.course === this.recordCourse);
    }

    if (this.recordStatus) {
      filtered = filtered.filter(r => r.status === this.recordStatus);
    }

    this.filteredAttendanceRecords = filtered;
  }

  attendanceRecords: any[] = [];

  recordSearch = '';
  selectedDate = '';
  recordClass = '';
  recordCourse = '';
  recordStatus = '';

  fromDate = '';
  toDate = '';
  searchedRecords: any[] = [];

  todayAttends: any = [];
  selectedStudentOV: any = {};

  // Handlers for HTML events
  onFilterChange() {
    this.applyFilters();
  }

  onRecordFilterChange() {
    this.applyRecordFilters();
  }
  closeModal() {
    this.isStudentPreview = false;
  }

  openOVModal(s: any) {
    this.selectedStudentOV = s;
    this.isStudentPreview = true;
  }

  isModalAttendance = true;

  closeAttendanceModal() {
    this.isModalAttendance = false;
  }

  isAttendsMarkerOpen = false;

  openAttendMarkerModal() {
    this.isAttendsMarkerOpen = true;
    console.log(this.isAttendsMarkerOpen);
  }

  closeAttendMarkerModal() {
    this.isAttendsMarkerOpen = false;
    this.searchedRecords = [];
    this.fromDate = '';
    this.toDate = '';
  }

  searchAttendance() {
    this.searchedRecords = [];
    if (!this.fromDate || !this.toDate) {
      this.notify.open('Please select both From and To dates', '', { duration: 2000 });
      return;
    }

    this.studentsDataSource.data.forEach((student: any) => {
      if (student.attendance) {
        student.attendance.forEach((record: any) => {
          if (record.date >= this.fromDate && record.date <= this.toDate) {
            this.searchedRecords.push({
              studentId: student.id,
              fullName: student.fullName,
              studentID: student.studentID,
              course: student.course,
              record: {
                ...record,
                isLocked: record.attend && record.attend !== 'none'
              }
            });
          }
        });
      }
    });

    // Sort by date then name
    this.searchedRecords.sort((a, b) => a.record.date.localeCompare(b.record.date) || a.fullName.localeCompare(b.fullName));

    if (this.searchedRecords.length === 0) {
      this.notify.open('No attendance records found for this range', '', { duration: 2000 });
    }
  }

  updateAttendance(entry: any, status: string) {
    if (!entry) return;

    // Determine the attendance record ID and the object to update locally
    // For searched records, the object is entry.record
    // For today's records, the object is entry itself
    const recordObj = entry.record ? entry.record : entry;
    if (!recordObj.id) return;

    const finalStatus = status === 'present' ? 'Present' : (status === 'absent' ? 'Absent' : (status === 'late' ? 'LPresent' : 'none'));

    this.api.makeStudentAttendance(recordObj.id, finalStatus).subscribe({
      next: (res) => {
        this.notify.open('Attendance updated successfully', '', { duration: 1500 });

        // Update local state for immediate UI feedback
        recordObj.attend = finalStatus;
        recordObj.isLocked = finalStatus !== 'none';

        this.getAllStudents(); // Refresh global stats
      },
      error: (err) => {
        this.notify.open('Failed to update attendance', '', { duration: 1500 });
      }
    });
  }

  exportToExcel() {
    const data = this.studentsDataSource.data;
    if (data.length === 0) return;

    const headers = ['Student Name', 'Student ID', 'Course', 'Present', 'Absent', 'Late', 'Leave'];
    const rows = data.map(s => [
      s.fullName,
      s.studentID,
      s.course,
      s.Atsummary?.present || 0,
      s.Atsummary?.absent || 0,
      s.Atsummary?.late || 0,
      s.Atsummary?.none || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${this.today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.open('Attendance report exported successfully', '', { duration: 1500 });
  }
}