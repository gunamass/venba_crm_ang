import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../layouts/confirm-dialog/confirm-dialog.component';
import { StorageService } from '../../services/storage.service';
import { MatTableDataSource } from '@angular/material/table';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RecordPaymentDialogComponent } from './record-payment-dialog.component';

@Component({
  selector: 'app-fees',
  imports: [SharedCommonModule, NgChartsModule],
  templateUrl: './fees.component.html',
  styleUrl: './fees.component.scss',
})
export class FeesComponent implements OnInit {
  studentsDataSource = new MatTableDataSource<any>([]);
  filterStorage: any = [];

  totalCollected = 0;
  totalDue = 0;
  totalExpected = 0;
  overdueCount = 0;
  collectionRate = 0;

  classes: string[] = [];
  courses: string[] = [];

  searchText = '';
  selectedClass = '';
  selectedCourse = '';
  selectedStatus = '';

  activeTab: string = 'overview';

  invoiceStudent: any = null;
  isGeneratingInvoice = false;
  today = new Date();

  constructor(
    private api: AllApiService,
    private notify: MatSnackBar,
    private dialog: MatDialog,
    private storeApi: StorageService
  ) { }

  ngOnInit() {
    this.getAllStudents();
  }

  getAllStudents() {
    this.api.getAllStudents().subscribe({
      next: (res) => {
        const data = res.responseObject || [];
        this.filterStorage = data;

        this.calculateStats();
        this.updateCharts();

        this.classes = [...new Set(data.map((s: any) => s.shift))].filter(Boolean) as string[];
        this.courses = [...new Set(data.map((s: any) => s.course))].filter(Boolean) as string[];

        this.applyFilters(); // Initial population
      },
      error: (err) => console.error(err)
    });
  }

  calculateStats() {
    this.totalCollected = 0;
    this.totalDue = 0;
    this.overdueCount = 0;

    this.filterStorage.forEach((s: any) => {
      // Logic from StudentsComponent
      const initial = Number(s.initialAmt) || 0;
      const paidDues = (s.dueDay || [])
        .filter((d: any) => d.status === 'Paid')
        .reduce((dSum: number, d: any) => dSum + Number(d.dueAmt || 0), 0);

      const balance = Number(s.balanceFee) || 0;

      this.totalCollected += (initial + paidDues);
      this.totalDue += balance;
      if (balance > 0) this.overdueCount++;
    });

    this.totalExpected = this.totalCollected + this.totalDue;
    this.collectionRate = this.totalExpected > 0 ? Math.round((this.totalCollected / this.totalExpected) * 100) : 0;
  }

  // Chart Logic
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Collected', 'Pending'],
    datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'] }]
  };
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  public doughnutChartType: ChartType = 'doughnut';

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Revenue (₹)', backgroundColor: '#6f42c1' }]
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } }
  };
  public barChartType: ChartType = 'bar';

  updateCharts() {
    this.doughnutChartData = {
      ...this.doughnutChartData,
      datasets: [{ ...this.doughnutChartData.datasets[0], data: [this.totalCollected, this.totalDue] }]
    };

    const courseRevenue = new Map<string, number>();
    this.filterStorage.forEach((s: any) => {
      const course = s.course || 'Other';
      const initial = Number(s.initialAmt) || 0;
      const paidDues = (s.dueDay || [])
        .filter((d: any) => d.status === 'Paid')
        .reduce((dSum: number, d: any) => dSum + Number(d.dueAmt || 0), 0);

      const paidTotal = initial + paidDues;
      courseRevenue.set(course, (courseRevenue.get(course) || 0) + paidTotal);
    });

    this.barChartData = {
      labels: Array.from(courseRevenue.keys()),
      datasets: [{ ...this.barChartData.datasets[0], data: Array.from(courseRevenue.values()) }]
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

    if (this.selectedStatus) {
      if (this.selectedStatus === 'Paid') {
        filtered = filtered.filter(s => (Number(s.balanceFee) || 0) === 0);
      } else if (this.selectedStatus === 'Pending') {
        filtered = filtered.filter(s => (Number(s.balanceFee) || 0) > 0);
      }
    }

    this.studentsDataSource.data = filtered;
  }

  markPaid(student: any) {
    const nextDue = student.dueDay?.find((d: any) => d.status === 'Not Paid' || d.status === 'Pending');

    if (!nextDue) {
      this.notify.open('No pending installments found', '', { duration: 1500 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Payment',
        message: `Are you sure you want to mark payment of ₹${nextDue.dueAmt} as paid for ${student.fullName}?`,
        confirmText: 'Mark Paid',
        cancelLabel: 'Cancel',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.makeStudentPayment(nextDue.id, 'Paid', student.id, 'Cash', new Date().toISOString()).subscribe({
          next: (res: any) => {
            this.notify.open('Payment marked successfully', '', { duration: 1500 });
            this.getAllStudents(); // Refresh data
          },
          error: (err: any) => {
            this.notify.open('Failed to update payment', '', { duration: 1400 });
          }
        });
      }
    });
  }

  exportToExcel() {
    const data = this.studentsDataSource.data;
    if (data.length === 0) return;

    const headers = ['Student Name', 'Student ID', 'Course', 'Total Fee', 'Collected', 'Balance', 'Status'];
    const rows = data.map(s => {
      const initial = Number(s.initialAmt) || 0;
      const paidDues = (s.dueDay || [])
        .filter((d: any) => d.status === 'Paid')
        .reduce((dSum: number, d: any) => dSum + Number(d.dueAmt || 0), 0);
      const paid = initial + paidDues;
      const balance = Number(s.balanceFee) || 0;
      const total = Number(s.totalFee) || 0;

      return [
        s.fullName,
        s.studentID,
        s.course,
        total,
        paid,
        balance,
        balance === 0 ? 'Paid' : 'Pending'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fee_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.open('Fee report exported successfully', '', { duration: 1500 });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  openRecordPayment() {
    const dialogRef = this.dialog.open(RecordPaymentDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getAllStudents(); // Refresh data after payment
      }
    });
  }

  async generateInvoice(student: any) {
    this.invoiceStudent = student;
    this.isGeneratingInvoice = true;
    this.notify.open('Generating invoice...', '', { duration: 1000 });

    // Wait for template to render
    setTimeout(async () => {
      const element = document.getElementById('invoice-template');
      if (element) {
        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('icon/logo.png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${student.fullName}_Invoice_${new Date().getTime()}.pdf`);

          this.notify.open('Invoice downloaded successfully', 'success', { duration: 2000 });
        } catch (error) {
          console.error('Invoice generation failed:', error);
          this.notify.open('Failed to generate invoice', 'error', { duration: 2000 });
        } finally {
          this.isGeneratingInvoice = false;
          this.invoiceStudent = null;
        }
      }
    }, 500);
  }
}
