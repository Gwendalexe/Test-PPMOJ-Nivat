import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-backoffice',
  imports: [RouterModule, NgFor],
  templateUrl: './backoffice.component.html',
  styleUrl: './backoffice.component.scss'
})
export class BackofficeComponent {
  modules = [
    {
      title: 'Résolution de problème',
      description: 'Gérer les formations de résolution de problèmes',
      route: '/backoffice/formations',
      icon: 'bi-book',
      color: '#D972FF',
      bgColor: 'rgba(217, 114, 255, 0.2)'
    },
    {
      title: 'Histoires',
      description: 'Gérer les histoires des mathématiques',
      route: '/backoffice/histoire',
      icon: 'bi-clock-history',
      color: '#FF6B9D',
      bgColor: 'rgba(255, 107, 157, 0.2)'
    },
    {
      title: 'Utilisateurs',
      description: 'Gérer les comptes utilisateurs',
      route: '/backoffice/users',
      icon: 'bi-people',
      color: '#7DDF64',
      bgColor: 'rgba(125, 223, 100, 0.2)'
    },
    {
      title: 'Énigmes de la semaine',
      description: 'Gérer les énigmes hebdomadaires',
      route: '/backoffice/weekproblems',
      icon: 'bi-calendar-week',
      color: '#dfbe64',
      bgColor: 'rgba(223, 190, 100, 0.2)'
    }
  ];
}
