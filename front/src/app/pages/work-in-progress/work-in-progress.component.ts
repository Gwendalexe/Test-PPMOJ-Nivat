import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-work-in-progress',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './work-in-progress.component.html',
  styleUrls: ['./work-in-progress.component.scss'],
  host: {
    'class': 'd-flex flex-column h-100 dark-theme'
  }
})
export class WorkInProgressComponent {

}
