import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, retry, switchMap } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AllApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {

  }

  baseMail = "https://nodemailsender-eta.vercel.app"

  sendMailToClient(payload: any): Observable<any> {
    return this.http.post(`${this.baseMail}/sendMailToClient`, payload);
  }


  creatAcc(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/user/create`, payLoad)
  }

  createUserAccount(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/users`, payLoad)
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/users`)
  }

  updateUserAccount(id: string, payLoad: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/users/${id}`, payLoad)
  }

  deleteUserAccount(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/users/${id}`)
  }

  appLogin(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/signIn2`, payLoad)
  }

  createDropDown(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-dropdown/create`, payLoad)
  }

  getAllDropDown(): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-dropdown/getAll`, {})
  }

  updateDropDown(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-dropdown/update`, payLoad)
  }
  getDashboardData(payLoad?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-das-board/getDashBoardDatas`, {})
  }



  getAllNotification(): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-das-board/getDailyNotification`, {})
  }

  getAllLead(): Observable<any> {

    return this.http.post(`${this.baseUrl}/venba/api-lead/getAllLeads`, {});
  }

  createLead(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-lead/create`, payLoad);
  }

  updateLeadStage(id: any, stage: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/venba/api-lead/updateStage?id=${id}&stage=${stage}`, {});
  }
  updateLeadRimLog(id: any, payLoad: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/venba/api-lead/updateReminder?leadId=${id}`, payLoad);
  }

  updateLeadActLog(id: any, payLoad: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/venba/api-lead/updateActivity?leadId=${id}`, payLoad);
  }


  //students api
  getAllStudents(): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-student/getAllStudents`, {});
  }

  createStudents(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-student/create`, payLoad);
  }

  enrollStudent(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-student/update`, payLoad);
  }


  makeStudentPayment(dueDayId: any, status: any, studentId: any, mode: any, time: any): Observable<any> {
    const queryParams = `dueDayId=${encodeURIComponent(dueDayId)}&status=${encodeURIComponent(status)}&studentId=${encodeURIComponent(studentId)}&paymentType=${encodeURIComponent(mode)}&paymentDateAndTime=${encodeURIComponent(time)}`;
    return this.http.post<any>(`${this.baseUrl}/venba/api-student/updatePaymentDetails?${queryParams}`, {});
  }

  makeStudentAttendance(attendanceId: any, status: any): Observable<any> {
    const queryParams = `attendanceId=${encodeURIComponent(attendanceId)}&status=${encodeURIComponent(status)}`;
    return this.http.post<any>(`${this.baseUrl}/venba/api-student/updateAttendanceDetails?${queryParams}`, {});
  }


  getAllStaff(): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-staff/getAllStaffsWithTask`, {})
  }

  addStaff(member: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-staff/create`, member);
  }

  deleteStaff(id: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/staff/${id}`)
  }


  getStaffById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/staff/${id}`);
  }

  updateStaff(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/staff/${id}`, data);
  }

  createTaskAndAssign(payLoad: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-task/create`, payLoad)
  }

  getAllTasks(): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-task/getAllTasks`, {})
  }

  changeTaskStatus(taskId: string, newStatus: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-task/taskStatusUpdateById?id=${taskId}&status=${newStatus}`, {});
  }

  getAllStaffAndIds(): Observable<any> {
    return this.http.post(`${this.baseUrl}/venba/api-staff/getAllStaffNameAndId`, {})
  }


}
