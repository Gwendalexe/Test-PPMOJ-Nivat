import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { User } from 'src/app/_models/User';
import { AuthService } from 'src/app/_services/auth.service';

type SortField = 'id' | 'username' | 'email' | 'token_coin' | 'mojettes' | 'role' | 'confirmed' | 'created_at';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-users',
  imports: [NgFor, NgIf, RouterModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  users: User[] = [];
  sortedUsers: User[] = [];
  sortField: SortField = 'created_at';
  sortDirection: SortDirection = 'desc';

  constructor(private authService: AuthService) {
    this.authService.getUsers().subscribe(users => {
      this.users = users;
      this.sortedUsers = [...users];
      this.sortUsers();
    });
  }

  sortUsers(field?: SortField) {
    if (field) {
      if (this.sortField === field) {
        // Toggle direction if clicking the same field
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
    }

    this.sortedUsers = [...this.users].sort((a, b) => {
      let aVal: any = a[this.sortField];
      let bVal: any = b[this.sortField];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle date strings
      if (this.sortField === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle string comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  downloadCSV() {
    if (this.sortedUsers.length === 0) return;

    // CSV Headers
    const headers = ['ID', 'Pseudo', 'Email', 'Tokens', 'Mojettes', 'Rôle', 'Statut', 'Date de création'];

    // Convert users to CSV rows
    const rows = this.sortedUsers.map(user => [
      user.id?.toString() || '',
      user.username || 'N/A',
      user.email || 'N/A',
      user.token_coin?.toString() || '0',
      user.mojettes?.toString() || '0',
      user.role || 'user',
      user.confirmed ? 'Confirmé' : 'Non confirmé',
      user.created_at ? this.formatDateForCSV(user.created_at) : 'N/A'
    ]);

    // Escape CSV values (handle commas and quotes)
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => escapeCSV(cell.toString())).join(','))
    ].join('\n');

    // Add BOM for UTF-8 to ensure Excel displays correctly
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDateForCSV(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
