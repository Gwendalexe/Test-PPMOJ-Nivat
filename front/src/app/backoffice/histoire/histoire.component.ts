import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Formation, FormationCategory } from 'src/app/_models/Formation';
import { FormationService } from 'src/app/_services/formation.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-histoire-backoffice',
  imports: [NgFor, NgIf, KeyValuePipe, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './histoire.component.html',
  styleUrl: './histoire.component.scss',
})
export class HistoireComponent {
  categories: {
    [key: number]: {
      category: FormationCategory;
      histoires: Formation[];
      form: FormGroup;
    };
  } = {};

  constructor(private formationService: FormationService) {
    this.formationService.getFormationCategories().subscribe(cat => {
      // Only show HISTOIRE category
      const histoireCategories = cat.filter((category: any) => category.code === 'HISTOIRE');
      histoireCategories.forEach((category: any) => {
        const form = new FormGroup({
          category_name: new FormControl(category.category_name),
          category_description: new FormControl(category.category_description),
          code: new FormControl(category.code),
        });
        this.formationService
          .getFormationByCode(category.code)
          .subscribe(data => {
            const uniqueHistoires = data.filter(
              (formation: Formation, index: number, self: Formation[]) =>
                index === self.findIndex(f => f.id === formation.id)
            );
            this.categories[category.id] = {
              category: category,
              histoires: uniqueHistoires,
              form: form,
            };
          });
      });
      console.log(this.categories);
    });
  }

  imgUrl = (u?: string) => {
    if (!u) return '';
    let url = u.startsWith('http') ? u : `${environment.apiUrl}${u}`;
    // Replace /image/ with /image/lowered/ for formations
    // url = url.replace('/formations/image/', '/formations/image/lowered/');
    return url;
  };

  onSubmit(id: number, form: FormGroup) {
    const name = form.get('category_name')?.value;
    const code = form.get('code')?.value;
    const description = form.get('category_description')?.value;
    const new_category: FormationCategory = {
      id: id,
      category_name: name,
      code: code,
      category_description: description,
    };
    this.formationService
      .updateFormationCategory(new_category)
      .subscribe(() => {
        console.log('Histoire category updated');
      });
  }

  onToggleDisplay(formation: Formation) {
    this.formationService.updateFormation({ ...formation, displayed: !formation.displayed }).subscribe(() => {
      // Reload the data
      this.formationService.getFormationCategories().subscribe(cat => {
        const histoireCategories = cat.filter((category: any) => category.code === 'HISTOIRE');
        histoireCategories.forEach((category: any) => {
          this.formationService
            .getFormationByCode(category.code)
            .subscribe(data => {
              const uniqueHistoires = data.filter(
                (formation: Formation, index: number, self: Formation[]) =>
                  index === self.findIndex(f => f.id === formation.id)
              );
              this.categories[category.id].histoires = uniqueHistoires;
            });
        });
      });
    });
  }
}

