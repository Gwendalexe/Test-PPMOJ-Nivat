import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  FormationCategory,
  FormationExtended,
  FormationSession,
} from 'src/app/_models/Formation';
import { User } from 'src/app/_models/User';
import { FormationService } from 'src/app/_services/formation.service';
import { DailymotionPlayerComponent } from 'src/app/components/dailymotion-player/dailymotion-player.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-formation',
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    DailymotionPlayerComponent,
    DatePipe,
  ],
  templateUrl: './formation.component.html',
  styleUrl: './formation.component.scss',
})
export class FormationComponent {
  formation: Omit<FormationExtended, 'sessions'> & {
    sessions: (FormationSession & { form: FormGroup })[];
  } = {
    id: 0,
    name: '',
    description: '',
    category: 0,
    price: 0,
    img_link: '',
    document_link: '',
    displayed: true,
    owned: false,
    sessions: [],
  };
  dateNow = new Date();
  categories: FormationCategory[];
  returnToHistoire: boolean = false;
  showCategorySelect: boolean = true; // Hide category select when creating from specific source
  form: FormGroup = new FormGroup({
    name: new FormControl('Nouvelle formation'),
    description: new FormControl(''),
    category: new FormControl(1),
    price: new FormControl(0),
    img_link: new FormControl(''),
    document_link: new FormControl(''),
    displayed: new FormControl(true),
  });
  sessionForm: FormGroup = new FormGroup({
    delivery_date: new FormControl(''),
    duration_minutes: new FormControl(0),
    speaker: new FormControl(''),
    live_link: new FormControl(''),
    replay_link: new FormControl(''),
  });
  users: User[] = [];
  userForm: FormGroup = new FormGroup({
    user_id: new FormControl(''),
  });
  imgUrl = (u?: string) => {
  if (!u) return '';
  // si le back renvoie un chemin relatif (/formations/image/...)
  let url = u.startsWith('http') ? u : `${environment.apiUrl}${u}`;
  // Replace /image/ with /image/lowered/ for formations
  url = url.replace('/formations/image/', '/formations/image/lowered/');
  return url;
};

  constructor(
    private formationService: FormationService,
    private route: ActivatedRoute
  ) {
    // Check if we came from histoire or probleme page
    const source = this.route.snapshot.queryParamMap.get('source');
    this.returnToHistoire = source === 'histoire';

    this.formationService.getFormationCategories().subscribe(data => {
      this.categories = data;
      // Also check if the formation category is HISTOIRE
      this.checkIfHistoireCategory();
      // Hide category select if editing a HISTOIRE or PROBLEME formation
      if (this.formation.id !== 0 && this.formation.category) {
        const category = this.categories.find(cat => cat.id === this.formation.category);
        if (category && (category.code === 'HISTOIRE' || category.code === 'PROBLEME')) {
          this.showCategorySelect = false;
        }
      }
    });

    this.route.params.subscribe(params => {
      console.log(params);
      if (params['id'] == 0) {
        // When creating a new formation
        const source = this.route.snapshot.queryParamMap.get('source');
        const catParam = this.route.snapshot.queryParamMap.get('cat');

        // Hide category select if coming from specific source
        this.showCategorySelect = !source || (source !== 'histoire' && source !== 'probleme');

        if (catParam) {
          this.formation.category = parseInt(catParam);
          this.form.controls['category'].setValue(this.formation.category);
        } else if (source && this.categories) {
          // If source is provided but no cat, find category by code
          const categoryCode = source === 'histoire' ? 'HISTOIRE' : 'PROBLEME';
          const category = this.categories.find(cat => cat.code === categoryCode);
          if (category) {
            this.formation.category = category.id;
            this.form.controls['category'].setValue(category.id);
          }
        }
        this.checkIfHistoireCategory();
        console.log(this.formation);
      } else {
        this.formationService
          .getFormationById(parseInt(params['id']))
          .subscribe(data => {
            this.formation = data as Omit<FormationExtended, 'sessions'> & {
              sessions: (FormationSession & { form: FormGroup })[];
            };
            console.log(this.formation);
            this.form.controls['name'].setValue(this.formation.name);
            this.form.controls['description'].setValue(
              this.formation.description
            );
            this.form.controls['category'].setValue(this.formation.category);
            this.form.controls['price'].setValue(this.formation.price);
            this.form.controls['img_link'].setValue(this.formation.img_link);
            this.form.controls['document_link'].setValue(
              this.formation.document_link
            );
            this.form.controls['displayed'].setValue(
              this.formation.displayed ?? true
            );
            this.checkIfHistoireCategory();
            // Hide category select if editing a HISTOIRE or PROBLEME formation
            // This will be set in the categories subscription if categories are loaded
            if (this.categories) {
              const category = this.categories.find(cat => cat.id === this.formation.category);
              if (category && (category.code === 'HISTOIRE' || category.code === 'PROBLEME')) {
                this.showCategorySelect = false;
              }
            }
            this.formation.sessions = this.formation.sessions.sort(
              (a, b) =>
                a.delivery_date.getTime() - b.delivery_date.getTime() ||
                a.duration_minutes - b.duration_minutes
            );
            this.formation.sessions.forEach(session => {
              const dateUTC = session.delivery_date;
              dateUTC.setMinutes(
                dateUTC.getMinutes() - dateUTC.getTimezoneOffset()
              );
              session.form = new FormGroup({
                delivery_date: new FormControl(
                  dateUTC.toISOString().slice(0, -1)
                ),
                duration_minutes: new FormControl(session.duration_minutes),
                speaker: new FormControl(session.speaker),
                live_link: new FormControl(session.live_link),
                replay_link: new FormControl(session.replay_link),
              });
            });
          });
        this.formationService
          .listFormationUsers(parseInt(params['id']))
          .subscribe(data => {
            this.users = data;
          });
      }
    });
  }

  importImage(evt: Event) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.form.disable();
  this.formationService.uploadFormationImage(file).subscribe({
    next: ({ image_url }) => {
      this.form.patchValue({ img_link: image_url });
      console.log('Image uploaded, URL:', image_url);
      this.form.enable();
    },
    error: () => {
      this.form.enable();
    }
  });
}

  onSubmit() {
    console.log(this.form.value);
    if (this.formation.id == 0) {
      // Ensure category is a number and all required fields are set
      const formData = {
        ...this.form.value,
        category: parseInt(this.form.value.category) || 0,
        price: parseInt(this.form.value.price) || 0,
        displayed: this.form.value.displayed ?? true,
        document_link: this.form.value.document_link || '',
        img_link: this.form.value.img_link || '',
      };
      console.log('Sending formation data:', formData);
      this.formationService.addFormation(formData).subscribe({
        next: (data) => {
          console.log(data);
          window.location.href = '/backoffice/formation/' + data.id;
        },
        error: (err) => {
          console.error('Error creating formation:', err);
          alert('Erreur lors de la création: ' + (err.error?.message || err.message || 'Erreur inconnue'));
        }
      });
    } else {
      this.form.value.id = this.formation.id;
      this.formationService.updateFormation(this.form.value).subscribe({
        next: (data) => {
          console.log(data);
          window.location.reload();
        },
        error: (err) => {
          console.error('Error updating formation:', err);
          alert('Erreur lors de la modification: ' + (err.error?.message || err.message || 'Erreur inconnue'));
        }
      });
    }
  }

  onDelete() {
    if (
      confirm(
        'Etes-vous sûr de vouloir supprimer cette formation ?\nCette action est irréversible et supprimera toutes les sessions associées, ainsi que tout les achats.'
      )
    ) {
      this.formationService
        .deleteFormation(this.formation.id)
        .subscribe(data => {
          console.log(data);
          window.location.href = this.returnToHistoire ? '/backoffice/histoire' : '/backoffice/formations';
        });
    }
  }

  normalizeReplayLink(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const rawValue = input.value?.trim() ?? '';
    if (!rawValue) {
      return;
    }

    const youtubeId = this.extractYoutubeId(rawValue);
    const dailymotionId = this.extractDailymotionId(rawValue);

    let normalized = rawValue;
    if (youtubeId) {
      normalized = `https://www.youtube.com/embed/${youtubeId}`;
    } else if (dailymotionId) {
      normalized = `https://geo.dailymotion.com/player.html?video=${dailymotionId}&sharing-enable=false&loop=true`;
    }

    if (normalized !== input.value) {
      input.value = normalized;
      input.dispatchEvent(new Event('input'));
    }
  }

  private extractYoutubeId(value: string): string | null {
    const prefixedMatch = value.match(/^youtube:(?<id>[a-zA-Z0-9_-]{11})$/);
    if (prefixedMatch?.groups?.['id']) {
      return prefixedMatch.groups['id'];
    }

    const urlMatch = value.match(
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)(?<id>[a-zA-Z0-9_-]{11})/
    );
    if (urlMatch?.groups?.['id']) {
      return urlMatch.groups['id'];
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : null;
  }

  private extractDailymotionId(value: string): string | null {
    const prefixedMatch = value.match(/^dailymotion:(?<id>[a-zA-Z0-9]+)/);
    if (prefixedMatch?.groups?.['id']) {
      return prefixedMatch.groups['id'];
    }

    const urlMatch = value.match(
      /^(?:https?:\/\/)?(?:(?:www|geo)\.)?dailymotion\.com\/(?:embed\/video\/|video\/|player\.html\?video=)?(?<id>[a-zA-Z0-9]+)/
    );
    if (urlMatch?.groups?.['id']) {
      return urlMatch.groups['id'];
    }

    return /^[a-zA-Z0-9]+$/.test(value) ? value : null;
  }

  onEditSession(session: FormationSession & { form: FormGroup }, event: any) {
    this.formationService
      .updateFormationSession(
        session.formation_id,
        session.formation_availability_id,
        {
          ...session.form.value,
          delivery_date: new Date(
            session.form.value.delivery_date
          ).toISOString(),
          formation_id: session.formation_id,
          formation_availability_id: session.formation_availability_id,
        }
      )
      .subscribe(data => {
        console.log(data);
        window.location.reload();
      });
  }

  onDeleteSession(session: FormationSession & { form: FormGroup }) {
    this.formationService
      .deleteFormationSession(
        session.formation_id,
        session.formation_availability_id
      )
      .subscribe(data => {
        console.log(data);
        window.location.reload();
      });
  }

  onCreationSession(event: any) {
    this.formationService
      .addFormationSession(this.formation.id, {
        ...this.sessionForm.value,
        delivery_date: new Date(
          this.sessionForm.value.delivery_date
        ).toISOString(),
        formation_id: this.formation.id,
      })
      .subscribe(data => {
        console.log(data);
        window.location.reload();
      });
  }

  onAddUsersToFormation(event: any) {
    const user_id = this.userForm.value.user_id;
    this.formationService
      .addUserToFormation(this.formation.id, user_id)
      .subscribe(data => {
        console.log(data);
        window.location.reload();
      });
  }

  removeUserFromFormation(user_id: number) {
    this.formationService
      .removeUserFromFormation(this.formation.id, user_id)
      .subscribe(data => {
        console.log(data);
        window.location.reload();
      });
  }

  checkIfHistoireCategory() {
    if (!this.categories || !this.formation.category) {
      return;
    }
    const category = this.categories.find(cat => cat.id === this.formation.category);
    if (category?.code === 'HISTOIRE') {
      this.returnToHistoire = true;
    }
  }

  getCategoryName(): string {
    if (!this.categories || !this.form.value.category) {
      return 'Catégorie sélectionnée';
    }
    const category = this.categories.find(c => c.id === this.form.value.category);
    return category?.category_name || 'Catégorie sélectionnée';
  }
}
