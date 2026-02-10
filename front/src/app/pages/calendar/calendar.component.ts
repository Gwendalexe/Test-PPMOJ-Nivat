import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormationExtended } from 'src/app/_models/Formation';
import { FormationService } from 'src/app/_services/formation.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  host: { class: 'dark-theme' },
  imports: [NavbarComponent, NgFor],
})
export class CalendarComponent implements OnInit {
  planning: any[] = [];

  constructor(private formationService: FormationService) {}

  ngOnInit(): void {
    this.formationService.getCalendar().subscribe(data => {
      this.planning = data
        .map((item: FormationExtended) => {
          return item.sessions.map(session => {
            return {
              ...session,
              ...item,
            };
          });
        })
        .flat()
        .sort((a, b) => {
          return a.delivery_date > b.delivery_date ? 1 : -1;
        });
    });
  }
}
