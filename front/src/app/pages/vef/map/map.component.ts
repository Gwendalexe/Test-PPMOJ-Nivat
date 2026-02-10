// map.component.ts
import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Department } from 'src/app/_models/Department';
import { Region } from 'src/app/_models/Region';
import { User } from 'src/app/_models/User';
import { InternalService } from 'src/app/_services/internal.service';
import { ProblemService } from '../../../_services/problem.service';
import { RegionService } from '../../../_services/region.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [NgIf, MatIcon, NgFor],
})
export class MapComponent implements OnInit, AfterViewChecked {
  @ViewChild('dptImage') dptImageRef!: ElementRef;

  isInfoUpdated = false;
  user: User | null = null;

  initialZones: any[] = [];
  regions: any[] = [];
  hoveredRegion: Region | null = null;
  zoomedRegion: Region | null = null;
  showedDpts: Array<Department> = [];

  zoomedDpt: Department | null = null;

  dptImage: string | null = null;

  imageHeight = 1103;
  imageWidth = 1103;

  zones: any[] = [];
  zonesCoords: string[] = [];

  problemsInfo = [];
  problemsCompleted = [];
  totalNbPb = 0;
  nbPbSolved = 0;

  infoUpdated = false;

  constructor(
    private regionService: RegionService,
    private problemService: ProblemService,
    private http: HttpClient,
    private router: Router,
    private internalService: InternalService
  ) {}

  ngOnInit() {
    combineLatest([
      this.regionService.getRegions(),
      this.problemService.getProblems(),
      this.problemService.getProblemsCompletedByUser(),
    ]).subscribe(data => {
      this.regions = data[0]!;
      this.problemsInfo = data[1]!;
      this.problemsCompleted = data[2]!;
      this.setProgression();
      this.infoUpdated = false;
    });
  }

  ngAfterViewChecked(): void {
    if (!this.regions) return;
    if (this.infoUpdated) return;
    this.regions.map((region: Region) => {
      this.updateRegionInfo(region);
    });
    this.infoUpdated = true;
    if (!this.zoomedRegion) return;
    this.showedDpts.map(department => {
      this.updateDptInfo(department);
    });
  }

  setProgression = () => {
    const getProblemsInZoomRange = (problemList: Array<never>) => {
      if (!this.zoomedRegion) return problemList.length;
      if (this.zoomedRegion && !this.zoomedDpt)
        return problemList.filter(
          (e: any) => e.region == this.zoomedRegion!.region_code
        ).length;
      return problemList.filter(
        (e: any) => e.department == this.zoomedDpt!.number
      ).length;
    };

    this.totalNbPb = getProblemsInZoomRange(this.problemsInfo);
    this.nbPbSolved = getProblemsInZoomRange(this.problemsCompleted);
  };

  updateRegionInfo = (region: Region) => {
    const regionEl = document.getElementById(`region_${region.region_code}`);
    const getRegionClassName = (region: Region): string => {
      if (!region || !region.viewBox) return 'inactive';

      const nbPbRegion = this.problemsInfo.filter(
        (e: any) => e.region == region.region_code
      ).length;
      const nbPbSolved = this.problemsCompleted.filter(
        (e: any) => e.region == region.region_code
      ).length;

      if (nbPbSolved == nbPbRegion) return 'completed';
      if (nbPbSolved != 0 && nbPbSolved != nbPbRegion) return 'in_progress';
      return 'default';
    };
    const regionClass = getRegionClassName(region);

    regionEl?.classList.add(getRegionClassName(region));
  };

  updateDptInfo = (department: Department) => {
    const dptEl = document.getElementById(`department_${department.number}`);

    const getDptClassName = (dpt: Department): string => {
      const nbPbDepartment = this.problemsInfo.filter(
        (e: any) => e.department == dpt.number
      ).length;
      const nbPbSolved = this.problemsCompleted.filter(
        (e: any) => e.department == dpt.number
      ).length;

      if (nbPbSolved == nbPbDepartment) return 'completed';
      if (nbPbSolved != 0 && nbPbSolved != nbPbDepartment) return 'in_progress';
      return 'default';
    };
    dptEl?.classList.add(getDptClassName(department));
  };

  setHoverRegion(region: any) {
    const textEl = document.getElementById(`regionName`);
    if (!textEl) return;

    if (region == null) {
      textEl?.classList.remove('active');
      return;
    }

    const path = document.getElementById(`region_${region.region_code}`) as any;
    const pathBBox = path?.getBBox();

    textEl.classList.add('active');
    textEl.textContent = region.name;
    textEl.setAttribute('x', -5 + pathBBox.x + pathBBox.width / 2);
    textEl.setAttribute('y', pathBBox.y + pathBBox.height / 2);
  }

  setHoverDepartment(department: any) {
    const textEl = document.getElementById(`departmentName`);
    if (!textEl) return;

    if (department == null) {
      textEl?.classList.remove('active');
      return;
    }

    const path = document.getElementById(
      `department_${department.number}`
    ) as any;
    const pathBBox = path?.getBBox();

    textEl.classList.add('active');
    textEl.textContent = department.name;
    textEl.setAttribute(
      'x',
      `${1.0 * pathBBox.x + (0.5 * pathBBox.width) / 2}`
    );
    textEl.setAttribute('y', pathBBox.y + pathBBox.height / 2);
  }

  resetZoom = () => {
    this.zoomedDpt = null;
    this.zoomedRegion = null;
    this.setProgression();
    this.infoUpdated = false;
  };

  zoomToRegion(region: Region) {
    if (region == this.zoomedRegion) {
      this.zoomedDpt = null;
      this.setProgression();
      this.infoUpdated = false;
      return;
    }

    this.zonesCoords = [];
    this.regionService.getDepartmentsByRegion(region.region_code).subscribe(
      departments => {
        this.zoomedRegion = region;
        this.showedDpts = departments;
        this.zonesCoords = [];
        this.setProgression();
        this.infoUpdated = false;
        return;
      },
      error => {
        console.error('Erreur lors de la récupération des départements:');
      }
    );
  }

  zoomToDepartment(zone: Department) {
    this.loadDepartmentDrawing(zone);
    this.setProgression();
  }

  // Fonction pour mettre à jour les coordonnées en fonction de la taille de l'image
  updateCoordsForNewImageSize(coef: number) {
    this.zonesCoords =
      []; /**Réinitialise les zones de coordonées pour éviter les bugs en changeant de départements */
    if (this.initialZones) {
      this.initialZones.forEach(zone => {
        zone.radius /= coef;
        zone.x /= coef;
        zone.y /= coef;
        this.zonesCoords.push(`${zone.x},${zone.y},${zone.radius}`);
      });
    }
  }

  loadDepartmentDrawing(department: Department): void {
    this.zoomedDpt = department;
    this.initialZones = JSON.parse(JSON.stringify(department.zones));
    this.zones = department.zones.map(zone => ({
      ...zone,
      initial: { x: zone.x, y: zone.y, radius: zone.radius },
    }));
    this.dptImage = `../../../assets/departments/${department.number}.png`;

    this.http.head(this.dptImage).subscribe(
      () => {
        const img = new Image();
        img.src = this.dptImage!;
        img.onload = () => {
          this.imageLoaded();
          const coef = (img.width / this.imageWidth) * 1.0;
          this.updateCoordsForNewImageSize(coef);
        };
      },
      error => {
        this.router.navigate(['/vef']);
      }
    );
  }

  imageLoaded() {
    const element = document.getElementById('dptImageRef');
    if (element) {
      this.imageWidth = element.offsetWidth;
      this.imageHeight = element.offsetHeight;
    }
  }

  handleClick(type: string) {
    const problem: any = this.problemsInfo.find(
      (e: any) =>
        e.department == this.zoomedDpt?.number && e.type == parseInt(type)
    );
    if (!problem && !problem.id) return;
    this.router.navigate(['/vef', problem.id]);
  }

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    if (!this.zoomedDpt) return;
    this.imageLoaded();
    this.loadDepartmentDrawing(this.zoomedDpt);
  }
}
