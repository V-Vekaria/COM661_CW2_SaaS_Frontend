import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WebService {

  private baseUrl: string = 'http://127.0.0.1:5001';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'x-access-token': token || '' });
  }

  // --- AUTH ---
  login(email: string, password: string) {
    return this.http.post<any>(this.baseUrl + '/login', {
      email: email,
      password: password
    });
  }

  // --- USERS ---
  getUsers(page: number, pageSize: number = 10) {
    return this.http.get<any>(
      this.baseUrl + '/users?pn=' + page + '&ps=' + pageSize,
      { headers: this.getHeaders() }
    );
  }

  getUserById(id: string) {
    return this.http.get<any>(
      this.baseUrl + '/users/' + id,
      { headers: this.getHeaders() }
    );
  }

  searchUsersByName(firstName: string, lastName: string) {
    return this.http.get<any>(
      this.baseUrl + '/users/search?first_name=' + firstName + '&last_name=' + lastName,
      { headers: this.getHeaders() }
    );
  }

  searchUsers(query: string) {
    return this.http.get<any>(
      this.baseUrl + '/users/search?q=' + query,
      { headers: this.getHeaders() }
    );
  }

  addUser(data: any) {
    return this.http.post<any>(
      this.baseUrl + '/users',
      data,
      { headers: this.getHeaders() }
    );
  }

  updateUser(id: string, data: any) {
    return this.http.put<any>(
      this.baseUrl + '/users/' + id,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteUser(id: string) {
    return this.http.delete<any>(
      this.baseUrl + '/users/' + id,
      { headers: this.getHeaders() }
    );
  }

  // --- USER SUB-RESOURCES ---
  getUserUsageLogs(userId: string, page: number, pageSize: number = 5) {
    return this.http.get<any>(
      this.baseUrl + '/users/' + userId + '/usage?pn=' + page + '&ps=' + pageSize,
      { headers: this.getHeaders() }
    );
  }

  getUserApiKeys(userId: string) {
    return this.http.get<any>(
      this.baseUrl + '/users/' + userId + '/api-keys',
      { headers: this.getHeaders() }
    );
  }

  revokeApiKey(userId: string, keyId: string) {
    return this.http.put<any>(
      this.baseUrl + '/users/' + userId + '/api-keys/' + keyId + '/revoke',
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteApiKey(userId: string, keyId: string) {
    return this.http.delete<any>(
      this.baseUrl + '/users/' + userId + '/api-keys/' + keyId,
      { headers: this.getHeaders() }
    );
  }

  getUserAlerts(userId: string) {
    return this.http.get<any>(
      this.baseUrl + '/users/' + userId + '/alerts',
      { headers: this.getHeaders() }
    );
  }

  acknowledgeAlert(userId: string, alertId: string) {
    return this.http.put<any>(
      this.baseUrl + '/users/' + userId + '/alerts/' + alertId + '/acknowledge',
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteAlert(userId: string, alertId: string) {
    return this.http.delete<any>(
      this.baseUrl + '/users/' + userId + '/alerts/' + alertId,
      { headers: this.getHeaders() }
    );
  }

  // --- ACTIVITY LOGS ---
  getActivityLogs(page: number, pageSize: number = 10) {
    return this.http.get<any>(
      this.baseUrl + '/activity-logs?pn=' + page + '&ps=' + pageSize,
      { headers: this.getHeaders() }
    );
  }

  getActivityLogById(id: string) {
    return this.http.get<any>(
      this.baseUrl + '/activity-logs/' + id,
      { headers: this.getHeaders() }
    );
  }

  // --- ANOMALY FLAGS ---
  getAnomalyFlags(page: number, pageSize: number = 10) {
    return this.http.get<any>(
      this.baseUrl + '/anomaly-flags?pn=' + page + '&ps=' + pageSize,
      { headers: this.getHeaders() }
    );
  }

  getAnomalyFlagById(id: string) {
    return this.http.get<any>(
      this.baseUrl + '/anomaly-flags/' + id,
      { headers: this.getHeaders() }
    );
  }

  resolveAnomaly(id: string, note: string) {
    return this.http.post<any>(
      this.baseUrl + '/anomaly-flags/' + id + '/resolve',
      { note: note },
      { headers: this.getHeaders() }
    );
  }

  // --- ACTIVITY LOGS ---
  getActivityLogsFiltered(relativeUrl: string) {
    return this.http.get<any>(
      this.baseUrl + relativeUrl,
      { headers: this.getHeaders() }
    );
  }

  addActivityLog(data: any) {
    return this.http.post<any>(
      this.baseUrl + '/activity-logs',
      data,
      { headers: this.getHeaders() }
    );
  }

  updateActivityLog(id: string, data: any) {
    return this.http.put<any>(
      this.baseUrl + '/activity-logs/' + id,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteActivityLog(id: string) {
    return this.http.delete<any>(
      this.baseUrl + '/activity-logs/' + id,
      { headers: this.getHeaders() }
    );
  }

  // --- ANOMALY FLAGS ---
  getAnomalyFlagsFiltered(relativeUrl: string) {
    return this.http.get<any>(
      this.baseUrl + relativeUrl,
      { headers: this.getHeaders() }
    );
  }

  updateAnomalyFlag(id: string, data: any) {
    return this.http.put<any>(
      this.baseUrl + '/anomaly-flags/' + id,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteAnomalyFlag(id: string) {
    return this.http.delete<any>(
      this.baseUrl + '/anomaly-flags/' + id,
      { headers: this.getHeaders() }
    );
  }

  deleteResolutionLog(flagId: string, resId: string) {
    return this.http.delete<any>(
      this.baseUrl + '/anomaly-flags/' + flagId + '/resolve/' + resId,
      { headers: this.getHeaders() }
    );
  }

  // --- ANALYTICS ---
  getAvgApiCallsByTier() {
    return this.http.get<any>(
      this.baseUrl + '/analytics/avg-api-calls-by-tier',
      { headers: this.getHeaders() }
    );
  }

  getHighUsage() {
    return this.http.get<any>(
      this.baseUrl + '/analytics/high-usage',
      { headers: this.getHeaders() }
    );
  }

  getFailedLogins() {
    return this.http.get<any>(
      this.baseUrl + '/analytics/failed-logins',
      { headers: this.getHeaders() }
    );
  }

  getAnomalySummary() {
    return this.http.get<any>(
      this.baseUrl + '/analytics/anomaly-summary',
      { headers: this.getHeaders() }
    );
  }

  getUserRiskReport() {
    return this.http.get<any>(
      this.baseUrl + '/analytics/user-risk-report',
      { headers: this.getHeaders() }
    );
  }

}