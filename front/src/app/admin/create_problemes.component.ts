import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AdminService } from 'src/app/_services/Admin.service';
import {
  TYPES_MAPPING,
  DEPARTMENTS_MAPPING,
  REGION_MAPPING,
} from './Constante/index';
import { filter } from 'rxjs';

@Component({
    selector: 'app-create-problemes',
    templateUrl: './create_problemes.component.html',
    styleUrls: ['./create_problemes.component.scss'],
    standalone: false
})
export class CreateProblemesComponent implements OnInit {
  form: FormGroup;
  RegionMappingEntries = REGION_MAPPING;
  DepartmentsMappingEntries = DEPARTMENTS_MAPPING;
  TypesMappingEntries = TYPES_MAPPING;
  fileUploadService: any;
  isEditMode = false;
  selectedEnigmeId: number | null = null;
  selectedEnigme: any = {};
  enigmes: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private adminService: AdminService
  ) {
    this.form = this.formBuilder.group({
      idregion: new FormControl<number>(0, Validators.required),
      idDepartement: new FormControl(
        { value: null, disabled: true },
        Validators.required
      ),
      IdEnigme: new FormControl(null, Validators.required),
      type: new FormControl(null, Validators.required),
      niveau: new FormControl(null, Validators.required),
      recompense: new FormControl('', Validators.required),
      enonce: new FormControl('', Validators.required),
      nbQuestion: new FormControl(null, Validators.required),
      nbValToFind: new FormControl(null, Validators.required),
      nbItem: new FormControl('', Validators.required),
      image: new FormControl(null),
      question: new FormControl(null, Validators.required),
      liste_val: new FormControl(null, Validators.required),
      solutions: new FormControl(null, Validators.required),
      enonce_Aide: new FormControl('', Validators.required),
      ValeurAide1: new FormControl(null, Validators.required),
    });
  }

  ngOnInit() {
    this.form.get('idregion')?.valueChanges.subscribe(value => {
      if (value) {
        this.form.get('idDepartement')?.enable();
      }
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    // Réinitialisez selectedEnigme si on quitte le mode édition
    if (!this.isEditMode) {
      this.selectedEnigme = {};
      this.selectedEnigmeId = null;
    }
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    const typeValue = this.form.get('type')?.value;
    const idDepartement = this.form.get('idDepartement')?.value;
    const idregion = this.form.get('idregion')?.value;

    let imagepath: string;
    if (typeValue == 0) {
      imagepath = 'm' + idDepartement.toString() + '.svg';
    } else if (typeValue == '1') {
      imagepath = 'i' + idDepartement.toString() + '.svg';
    } else {
      imagepath = idregion.toString() + '.svg';
    }
    this.form.get('image')?.setValue(new File([file], imagepath));
  }

  submitForm() {
    // Accède aux valeurs du formulaire
    const idregion = this.form.get('idregion')?.value;
    const type = this.form.get('type')?.value;
    const idDepartement = this.form.get('idDepartement')?.value;
    const nbQuestion = this.form.get('nbQuestion')?.value;
    const nbValToFind = this.form.get('nbValToFind')?.value;
    const nbItem = this.form.get('nbItem')?.value;
    const niveauValue = parseInt(this.form.get('niveau')?.value);
    const recompenseValue = this.form.get('recompense')?.value;
    const enonceValue = this.form.get('enonce')?.value;
    const ValeurAide1Value = parseInt(this.form.get('ValeurAide1')?.value);
    const enonce_AideValue = this.form.get('enonce_Aide')?.value;
    const questionValue = this.form.get('question')?.value;
    const typeValue = idDepartement.toString() + type.toString();
    // Traitement de listeQuestion basé sur le séparateur ";"
    const listeQuestion = questionValue
      .split(';')
      .map((question: string) => question.trim())
      .filter((question: any) => question);

    // Décodage de liste_valValue pour s'assurer que chaque élément est un tableau
    let liste_valValue;
    try {
      liste_valValue = JSON.parse(this.form.get('liste_val')?.value);
      // S'assurer que chaque élément est un tableau
      liste_valValue = liste_valValue.map((item: any) =>
        Array.isArray(item) ? item : [item]
      );
    } catch (e) {
      console.error('Erreur lors du décodage de liste_valValue:', e);
      return; // Ou gérer l'erreur d'une manière appropriée
    }

    // Décodage de solutions pour obtenir un tableau d'objets JavaScript
    let solutions;
    try {
      solutions = JSON.parse(this.form.get('solutions')?.value);
    } catch (e) {
      console.error('Erreur lors du décodage des solutions:', e);
      return; // Ou gérer l'erreur d'une manière appropriée
    }

    const formData = new FormData();
    formData.append('idregion', idregion);
    formData.append('typeValue', typeValue);
    this.adminService
      .CreatePb(
        idregion,
        typeValue,
        niveauValue,
        enonceValue,
        recompenseValue,
        nbQuestion,
        nbValToFind,
        nbItem,
        ValeurAide1Value,
        enonce_AideValue,
        listeQuestion,
        liste_valValue,
        solutions
      )
      .subscribe(() => {});

    // Réinitialiser le formulaire après la soumission
    this.form.reset();
  }

  onFileSelected(event: any) {
    const type = this.form.get('type')?.value;
    const idDepartement = this.form.get('idDepartement')?.value;
    const idEnigme = idDepartement.toString() + type.toString();
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type !== 'image/svg+xml') {
        console.error("Le fichier sélectionné n'est pas un SVG.");
        return;
      }
      // Créez une instance de FileReader
      const reader = new FileReader();

      // Définissez le gestionnaire pour l'événement onload
      reader.onload = (e: any) => {
        const content = e.target.result; // Voici le contenu texte du SVG
        this.adminService.uploadFile(idEnigme, content).subscribe();
      };

      // Lisez le contenu du fichier SVG
      reader.readAsText(file);
    }
  }

  onEnigmeSelect() {
    const type = this.form.get('type')?.value;
    const idDepartement = this.form.get('idDepartement')?.value;
    const idregion = this.form.get('idregion')?.value;
    const typeValue = idDepartement.toString() + type.toString();
    if (idDepartement && type) {
      // Supposons que getEnigmeById attend l'ID de l'énigme et non une concaténation de type et idDepartement
      this.adminService
        .getEnigmeById(typeValue, idregion)
        .subscribe((enigme: any) => {
          if (enigme) {
            this.selectedEnigme = enigme;
            this.form.patchValue({
              idregion: enigme.region,
              idDepartement: enigme.id.toString().slice(0, -1), // Ajuster selon la logique souhaitée
              type: enigme.type, // Ajustez cette ligne si la structure de l'objet est différente
              niveau: enigme.niveau,
              recompense: enigme.recompense,
              nbQuestion: enigme.nbQuestion,
              nbValToFind: enigme.nbValToFind,
              nbItem: enigme.nbItem,
              enonce: enigme.enonce,
              ValeurAide1: enigme.ValeurAide1,
              enonce_Aide: enigme.aide1, // Assurez-vous que la propriété est correcte
              question: Array.isArray(enigme.question)
                ? enigme.question.join(',')
                : '',
              liste_val: JSON.stringify(enigme.liste_val),
              solutions: JSON.stringify(enigme.solution), // Assurez-vous que la propriété est 'solutions' et non 'solution'
            });
          }
        });
    }
  }

  updateEnigme() {
    // Supposons que `adminService.updateEnigme` existe et permet de mettre à jour une énigme
    // Vous devrez peut-être collecter les données du formulaire pour les passer à cette méthode
    this.adminService.updateEnigme(this.selectedEnigme).subscribe(() => {
      // Effectuez d'autres actions après la mise à jour, comme réinitialiser le formulaire ou notifier l'utilisateur
    });
  }
}
