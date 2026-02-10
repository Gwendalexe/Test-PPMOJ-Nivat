import { Component, OnInit, HostBinding } from '@angular/core';
import { InternalService } from '../../_services/internal.service';
import { ActivatedRoute } from '@angular/router';

import { User } from 'src/app/_models/User';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { NgIf } from '@angular/common';
import { MapComponent } from './map/map.component';
import { ProblemesComponent } from './Problemes/problemes.component';

@Component({
    selector: 'app-vef',
    templateUrl: './vef.component.html',
    styleUrls: ['./vef.component.scss'],
    host: { class: 'dark-theme' },
    imports: [NavbarComponent, NgIf, MapComponent, ProblemesComponent]
})
export class VefComponent implements OnInit {
  user: User | null = null;
  queryParams = -1;

  constructor(
    private internalService: InternalService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.user = this.internalService.loadUserFromLocalStorage();
    if (!this.user || !this.user.id) return;

    this.route.params.subscribe(params => {
      if (!params['id']) return;
      this.queryParams = parseInt(params['id']);
    });
  }
}
