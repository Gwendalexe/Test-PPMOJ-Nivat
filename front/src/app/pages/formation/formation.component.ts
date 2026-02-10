import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormationExtended } from 'src/app/_models/Formation';
import { AuthService } from 'src/app/_services/auth.service';
import { FormationService } from 'src/app/_services/formation.service';
import { DailymotionPlayerComponent } from 'src/app/components/dailymotion-player/dailymotion-player.component';
import { environment } from 'src/environments/environment';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-formation',
  templateUrl: './formation.component.html',
  styleUrls: ['./formation.component.scss'],
  host: { class: 'light-theme' },
  imports: [NavbarComponent, NgIf, NgFor, DailymotionPlayerComponent],
})
export class FormationComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formationService: FormationService,
    private authService: AuthService
  ) {}

  formation: FormationExtended | null = null;
  formation_live_url: SafeResourceUrl | null = null;
  formation_replay_url: SafeResourceUrl | null = null;
  isImageModalOpen = false;
  modalImageSrc = '';
  isImageZoomed = false;

  ngOnInit(): void {
    this.route.params.subscribe((params: { [key: string]: string }) => {
      this.formationService.getFormationById(Number(params['id'])).subscribe(
        data => {
          console.log(data);
          this.formation = data; //TODO: new UI
          if (this.formation == null) {
            this.router.navigate(['/formations']);
          }
        },
        error => {
          this.router.navigate(['/formations']);
        }
      );
    });
  }

  buyformation(): void {
    console.log('buy formation');
    this.formationService.buyFormation(this.formation?.id ?? 0).subscribe(
      data => {
        this.authService.reloadUser();
      },
      error => {
        console.log(error);
      }
    );
  }

  imgUrl(u?: string) {
    if (!u) return '';
    return u.startsWith('http') ? u : `${environment.apiUrl}${u}`;
  }

  openImageModal(imageSrc?: string) {
    if (!imageSrc) return;
    this.modalImageSrc = imageSrc;
    this.isImageModalOpen = true;
    this.isImageZoomed = false;
    document.body.classList.add('modal-open');
  }

  closeImageModal() {
    this.isImageModalOpen = false;
    this.modalImageSrc = '';
    this.isImageZoomed = false;
    document.body.classList.remove('modal-open');
  }

  toggleImageZoom(event: Event) {
    event.stopPropagation();
    this.isImageZoomed = !this.isImageZoomed;
  }
}
