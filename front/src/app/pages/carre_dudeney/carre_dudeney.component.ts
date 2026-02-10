import {
  CdkDragDrop,
  CdkDragMove,
  DragDropModule,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Colors } from 'src/app/_models/Generics';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { CarreProblem, SolutionTile, Tile } from '../../_models/Pbcpts';
import { AuthService } from '../../_services/auth.service';
import { ConfettiService } from '../../_services/confetti.service';
import { CPTService } from '../../_services/CPT.service';
import { InternalService } from '../../_services/internal.service';

@Component({
  selector: 'app-carre-dudeney',
  templateUrl: './carre_dudeney.component.html',
  styleUrls: ['./carre_dudeney.component.scss'],
  host: { class: 'dark-theme' },
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    NavbarComponent,
  ],
})
export class CarreDudeneyComponent implements OnInit {
  @ViewChild('doneList', { read: ElementRef, static: true })
  dropZone: ElementRef;
  size: number[] = [];

  currentUser: { [key: string]: string | number };

  timer: NodeJS.Timeout;
  timeElapsed = 0;
  isLoading = true;
  hasGameStarted = false;
  hasBeenSolved = false;

  carreId: number;
  reward = 0;
  cptWidth = 0;
  cptHeight = 0;
  nbCarre = 0;
  surfaceWidthPx = 0;
  tileSize = 0;

  off = { x: 0, y: 0 };
  scaleX = 1;
  scaleY = 1;
  _pointerPosition: CdkDragMove['pointerPosition'];

  surfaceTiles: Array<Tile> = [];
  inventoryTiles: Array<Tile> = [];

  defaultColor = { background: 'white', color: 'black' };
  tileColors = [
    { background: Colors.Yellow, color: 'black' },
    { background: Colors.Red, color: 'white' },
    { background: Colors.Green, color: 'black' },
    { background: Colors.White, color: 'black' },
    { background: Colors.Blue, color: 'black' },
    { background: Colors.Pink, color: 'black' },
    { background: Colors.Purple, color: 'white' },
  ];

  constructor(
    private internalService: InternalService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly CPTService: CPTService,
    private confettiService: ConfettiService
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') ?? '');
    if (this.hasBeenSolved) return;
    this.getGrid();
  }

  private getGrid(): void {
    this.CPTService.getCurrentCarre().subscribe((carre: CarreProblem | null) =>
      this.initCPT(carre)
    );
  }

  newGrid(): void {
    this.isLoading = true;
    this.hasGameStarted = false;
    this.hasBeenSolved = false;
    this.surfaceTiles = [];
    this.inventoryTiles = [];
    this.off = { x: 0, y: 0 };
    this.CPTService.getRandomCarre().subscribe((carre: CarreProblem | null) =>
      this.initCPT(carre)
    );
  }

  initCPT(carre: CarreProblem | null): void {
    if (!carre) return;
    this.carreId = carre.id;
    this.CPTService.hasUserSolvedCarre(carre.id).subscribe({
      next: response => {
        this.hasBeenSolved = true;
        this.timeElapsed = response.completion_time;
        this.reward = response.reward;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        if (!carre?.carre_list) return;

        if (carre.height && carre.width) {
          const surface = document.getElementById('surface') as HTMLDivElement;
          this.surfaceWidthPx = surface.getBoundingClientRect().width ?? 0;
          this.cptHeight = carre.height;
          this.cptWidth = carre.width;
          surface.style.setProperty(
            'aspect-ratio',
            `${carre.width}/${carre.height}`
          );
        }
        if (carre.carre_list) {
          this.nbCarre = carre.carre_list.length;
          this.inventoryTiles = carre.carre_list
            .map((tuile, i) => {
              return {
                id: i,
                size: tuile,
                width: this.getTuileWidth(tuile),
                x: 0,
                y: 0,
                gridX: 0,
                gridY: 0,
                'z-index': 0,
                color: this.defaultColor,
              };
            })
            .sort((tile1: Tile, tile2: Tile) => tile2.size - tile1.size)
            .map((tile, i) => {
              tile['z-index'] = i;
              tile['color'] = this.tileColors[i % this.tileColors.length];
              return tile;
            });
        }
        this.tileSize = this.surfaceWidthPx / this.cptWidth;
        this.initGridInfo();
      },
    });
  }

  getRandomColor = () =>
    this.tileColors[Math.floor(this.tileColors.length * Math.random())];

  getTuileWidth = (size: number): number =>
    (size / this.cptWidth) * this.surfaceWidthPx;

  drop(event: CdkDragDrop<Tile[], Tile[], Tile>) {
    document.getElementById('surface')?.classList.remove('onDrag');

    if (event.previousContainer !== event.container) {
      if (!this.hasGameStarted) {
        this.toggleTimer();
        this.hasGameStarted = true;
      }
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const scaleRatio = this.getTuileWidth(event.container.data[0].size) / 64;
      const posY =
        this._pointerPosition.y -
        this.off.y * scaleRatio -
        this.dropZone.nativeElement.getBoundingClientRect().top;
      const posX =
        this._pointerPosition.x -
        this.off.x * scaleRatio -
        this.dropZone.nativeElement.getBoundingClientRect().left;

      const gridPosition = this.getGridPosition(
        posX,
        posY,
        event.container.data[0].size
      );
      event.item.data.gridX = gridPosition.gridX;
      event.item.data.gridY = gridPosition.gridY;

      this.checkGridValidity();
      event.item.data.x = this.getTileOffset(event.item.data.gridX);
      event.item.data.y = this.getTileOffset(event.item.data.gridY);
    }
  }

  getGridPosition = (
    posX: number,
    posY: number,
    size: number
  ): { gridX: number; gridY: number } => {
    const gridTileWidth =
      this.dropZone.nativeElement.getBoundingClientRect().width / this.cptWidth;
    return {
      gridX: Math.max(
        0,
        Math.min(this.cptWidth - size, Math.floor(posX / gridTileWidth))
      ),
      gridY: Math.max(
        0,
        Math.min(this.cptHeight - size, Math.floor(posY / gridTileWidth))
      ),
    };
  };

  getTileOffset = (gridIndex: number): number =>
    Math.trunc(gridIndex * this.tileSize) + 1;

  moved(event: CdkDragMove) {
    this._pointerPosition = event.pointerPosition;
  }

  changePosition(event: CdkDragDrop<Tile[], Tile[], Tile>, tile: Tile) {
    const gridDisplacement = {
      deltaX: Math.round(event.distance.x / this.tileSize),
      deltaY: Math.round(event.distance.y / this.tileSize),
    };
    const isMoveOut = (margin: number) => {
      return (
        tile.gridX + gridDisplacement.deltaX < -margin ||
        tile.gridX + gridDisplacement.deltaX > this.cptWidth + margin ||
        tile.gridY + gridDisplacement.deltaY < -margin ||
        tile.gridY + gridDisplacement.deltaY > this.cptHeight + margin
      );
    };

    if (isMoveOut(tile.size / 2)) {
      this.inventoryTiles.push(tile);
      this.inventoryTiles.sort(
        (tile1: Tile, tile2: Tile) => tile2.size - tile1.size
      );
      this.surfaceTiles = this.surfaceTiles.filter(x => x != tile);
      return;
    }

    tile.gridY = Math.max(
      0,
      Math.min(tile.gridY + gridDisplacement.deltaY, this.cptHeight - tile.size)
    );
    tile.gridX = Math.max(
      0,
      Math.min(tile.gridX + gridDisplacement.deltaX, this.cptWidth - tile.size)
    );

    this.checkGridValidity();
    const tileEl = document.getElementById(`tile_${tile.id}`) as HTMLDivElement;
    tileEl.style.setProperty('top', `${this.getTileOffset(tile.gridY)}px`);
    tileEl.style.setProperty('left', `${this.getTileOffset(tile.gridX)}px`);
    tileEl.style.setProperty('zIndex', `${this.nbCarre - tile.id - 1}`);
  }

  checkGridValidity = (): void => {
    if (this.inventoryTiles.length != 0) return;
    const solArr = Array(this.cptHeight * this.cptWidth).fill(-1);
    this.surfaceTiles.forEach(tile => {
      Array(tile.size)
        .fill(0)
        .map((e, i) =>
          Array(tile.size)
            .fill(0)
            .map((f, j) => tile.gridX + (tile.gridY + i) * this.cptWidth + j)
        )
        .reduce((acc, val) => acc.concat(val), [])
        .forEach(index => (solArr[index] = tile.id));
    });

    if (solArr.indexOf(-1) >= 0) return;
    this.hasBeenSolved = true;
    clearInterval(this.timer);
    this.CPTService.postSolvedCarre(
      this.carreId,
      this.surfaceTiles.map(e => e as SolutionTile),
      this.timeElapsed
    ).subscribe(response => {
      this.hasBeenSolved = true;
      this.reward = response.reward;
      this.authService.sendUpdateMojette(response.mojettes);
      // Trigger confetti animation on successful completion
      this.confettiService.trigger();
    });
  };

  initGridInfo = (): void => {
    const spanInfo = document.getElementById(
      `grid-info-span`
    ) as HTMLSpanElement;
    spanInfo.textContent = `${this.cptWidth} x ${this.cptHeight}`;
    const gridSpan = document.getElementById('grid-span') as HTMLSpanElement;

    if (this.cptWidth > 50) return;
    gridSpan.style.setProperty('--grid-size', `${this.getTuileWidth(1)}px`);
    gridSpan.style.setProperty('--grid-height', `${this.cptHeight}`);
  };

  onHorizontalScroll = (e: WheelEvent) => {
    const container = document.getElementById(`inventaire`) as HTMLDivElement;
    if (e.deltaY !== 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY * 0.5;
    }
  };

  toggleTimer = (): void => {
    const startButton = document.getElementById(
      'timer-btn'
    ) as HTMLButtonElement;
    const timerSpan = document.getElementById('timer-span') as HTMLSpanElement;
    if (this.hasGameStarted) {
      this.resetGrid();
      clearInterval(this.timer);
      timerSpan.textContent = this.updateTimerDisplay(0);
    }
    if (!this.hasGameStarted) {
      this.timeElapsed = 0;
      this.timer = setInterval(() => {
        this.timeElapsed++;
        timerSpan.textContent = this.updateTimerDisplay(this.timeElapsed);
      }, 1000);
    }

    startButton.textContent = this.hasGameStarted ? 'Start' : 'Reset';
    this.hasGameStarted = !this.hasGameStarted;
  };

  resetGrid = () => {
    this.inventoryTiles = this.inventoryTiles
      .concat(this.surfaceTiles)
      .sort((tile1: Tile, tile2: Tile) => tile2.size - tile1.size);
    this.surfaceTiles = [];
  };

  updateTimerDisplay = (time: number): string => {
    const pad = (value: number): string =>
      value < 10 ? `0${value}` : value.toString();
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  timeToString = (time: number): string => {
    const timeMinutes = Math.floor(time / 60);
    const timeSecondes = time % 60;
    const textMinutes = timeMinutes == 1 ? 'minute' : 'minutes';
    const textSecondes = timeSecondes == 1 ? 'seconde' : 'secondes';
    return `${timeMinutes ? timeMinutes + ' ' + textMinutes + ' ' : ''}${timeSecondes + ' ' + textSecondes}`;
  };

  goToHomePage = (): void => {
    this.router.navigate(['/']);
  };
}
