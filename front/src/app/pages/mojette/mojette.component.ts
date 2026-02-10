import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Mojette, MojetteShapeTypes } from 'src/app/_models/Mojette';
import { InternalService } from 'src/app/_services/internal.service';
import { LeaderboardTableComponent } from 'src/app/components/leaderboard-table/leaderboard-table.component'; // Ajouté ici
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { User } from '../../_models/User';
import { AuthService } from '../../_services/auth.service';
import { ConfettiService } from '../../_services/confetti.service';
import { MojetteService } from '../../_services/mojette.service';

interface DailyCalendarDay {
  dayNumber: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface DailyCalendarWeek {
  weekNumber: number;
  days: DailyCalendarDay[];
}

@Component({
  selector: 'app-mojette',
  templateUrl: './mojette.component.html',
  styleUrls: ['./mojette.component.scss'],
  host: { class: 'dark-theme' },
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    NavbarComponent,
    LeaderboardTableComponent,
  ],
})
export class MojetteComponent implements AfterViewInit, OnInit {
  currentUser: User;
  @ViewChild('matriceContainer') matriceContainer!: ElementRef;
  rerender = false;
  hasStarted = false;
  timer: any;
  timeElapsed = 0;
  hasBeenSolved = false;
  isHelpOpen = false;
  selectedLevel = '4';
  showFinishedGrid = false;
  dailyGridDays: number[] = [];
  todayDayNumber: number = new Date().getDate();
  dailyGridCompletionStatus: Record<string, boolean> = {};
  weekDayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  dailyCalendarWeeks: DailyCalendarWeek[] = [];
  isCurrentGridDaily: boolean = false;
  activeDailyDay: number | null = null;

  availableGridsByLevel: { [key: string]: Array<Mojette> } = {
    '1': [],
    '2': [],
    '3': [],
  };

  currentNbGrid: Array<Mojette> = [];
  nextNbGrid: Array<Mojette> = [];
  reward = 0;
  helpsUsed = 0;
  helpCost = 0;
  gridLevel = -1;
  gridId = 0;
  height = 0;
  width = 0;
  gridShape: MojetteShapeTypes | null = null;
  arrayBox: Array<number> = [];
  bins: { [key: string]: Array<number> } = {
    down: [],
    left: [],
    right: [],
  };

  levelName = ['Facile', 'Moyen', 'Difficile'];
  sidesOrder = ['right', 'left', 'down'];
  currentBinDown: number[] = [];
  currentBinLeft: number[] = [];
  currentBinRight: number[] = [];

  mjGridValues: Array<number> = [];

  changeHistory: { tileID: number; prevValue: number }[] = [];

  lastClickedTileIndex = -1;

  constructor(
    private internalService: InternalService,
    private router: Router,
    private authService: AuthService,
    private mojetteService: MojetteService,
    private confettiService: ConfettiService
  ) {}

  ngOnInit(): void {
    // if (this.hasBeenSolved) return;
    const userStored = localStorage.getItem('currentUser');
    if (userStored === null) return;
    this.currentUser = JSON.parse(userStored);
    if (!this.currentUser.tutorial_mojette_done) {
      this.goToTutorial();
      return;
    }

    this.generateDailyGridDays();
    this.getDailyGrid();
    this.handleHelpSwipe();

    this.mojetteService.getDailyGridsCompletionStatus().subscribe(
      completionStatus => {
        this.dailyGridCompletionStatus = completionStatus;
        // console.log(
        //   'Daily grid completion status:',
        //   this.dailyGridCompletionStatus
        // );
      },
      error => {
        console.error('Error fetching daily grid completion status:', error);
      }
    );

    combineLatest(
      [1, 2, 3].map(e => this.mojetteService.getMojettesGridByLevel(e))
    ).subscribe((data: Array<Array<Mojette>>) => {
      data.forEach((e, i) => (this.availableGridsByLevel[i + 1] = e));
      this.currentNbGrid = this.availableGridsByLevel[this.selectedLevel];
      this.nextNbGrid = this.availableGridsByLevel[this.selectedLevel];
    });
  }

  generateDailyGridDays() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    today.setHours(0, 0, 0, 0);
    this.todayDayNumber = today.getDate();
    this.dailyGridDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    this.buildDailyCalendarWeeks(today);
  }

  ngAfterViewInit(): void {
    const splitContainerDiv = document.getElementById('split-container');
    const toggleBtn = document.getElementById('toggle-help-btn');
    const modalBackdrop = document.getElementById('modal-backdrop');

    if (toggleBtn === null) return;
    toggleBtn.onclick = () => (this.isHelpOpen = !this.isHelpOpen);
    if (modalBackdrop === null) return;
    modalBackdrop.onclick = () => (this.isHelpOpen = false);
    if (splitContainerDiv === null) return;

    const splitsStylesDict: Array<string> = [
      'downSplit',
      'leftSplit',
      'rightSplit',
    ];
    splitsStylesDict.forEach(key => {
      const splitDiv: HTMLDivElement = document.createElement('div');
      splitDiv.id = key;
      splitDiv.classList.add('split');
      splitContainerDiv.appendChild(splitDiv);
    });

    // const startButton = document.getElementById('timer-btn')!;
    // startButton.onclick = this.toggleTimer;

    const revertButton = document.getElementById('btn_kb_back');
    if (revertButton === null) return;
    revertButton.onclick = () => revertChange();

    const hintButton = document.getElementById('btn_hint');
    if (hintButton === null) return;
    hintButton.onclick = () => askHint();

    const revertChange = () => {
      if (!this.changeHistory.length) return;
      const lastChange = this.changeHistory.pop();
      if (lastChange === undefined) return;
      this.addValueToTile(lastChange.prevValue, lastChange.tileID, 'revert');
      if (!this.changeHistory.length)
        document.getElementById('btn_kb_back')?.classList.add('disabled');
    };

    const askHint = () => {
      this.mojetteService.getMojetteHint(this.gridId).subscribe(
        (response: { [key: string]: number }) => {
          this.helpsUsed += 1;
          this.authService.sendUpdateMojette(response['mojettes']);
          this.colorSelectedTiles(this.arrayBox[response['tile']]);
          this.addValueToTile(response['value'], response['tile'], 'input');
        },
        () => {
          hintButton.classList.add('error');
          setTimeout(() => {
            hintButton.classList.remove('error');
          }, 450);
        }
      );
    };

    this.bindKeyboardButtons();
  }

  private buildDailyCalendarWeeks(referenceDate: Date): void {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const startOfFirstWeek = this.getStartOfWeek(firstDayOfMonth);

    const weeks: DailyCalendarWeek[] = [];
    let processedDays = 0;
    const cursor = new Date(startOfFirstWeek);

    while (processedDays < daysInMonth) {
      const weekStart = new Date(cursor);
      const weekNumber = this.getISOWeekNumber(weekStart);
      const days: DailyCalendarDay[] = [];

      for (let i = 0; i < 7; i++) {
        const current = new Date(cursor);
        const isCurrentMonth = current.getMonth() === month;
        if (isCurrentMonth) {
          processedDays += 1;
        }
        days.push({
          dayNumber: isCurrentMonth ? current.getDate() : null,
          isCurrentMonth,
          isToday: this.isSameDay(current, referenceDate),
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      weeks.push({ weekNumber, days });
    }

    this.dailyCalendarWeeks = weeks;
  }

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getISOWeekNumber(date: Date): number {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const firstWeekStart = this.getStartOfWeek(firstThursday);
    const diff =
      target.getTime() - firstWeekStart.getTime();
    return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  private bindKeyboardButtons(): void {
    const attachHandler = (element: HTMLElement | null) => {
      if (!element) return;

      const handler = (event: Event) => {
        event.preventDefault();

        if (this.lastClickedTileIndex === -1) return;

        const button = event.currentTarget as HTMLButtonElement | null;
        if (!button) return;

        const valuePart =
          button.getAttribute('data-value') ?? button.id.split('_').pop();
        if (valuePart === undefined) return;

        const value = parseInt(valuePart, 10);
        if (Number.isNaN(value)) return;

        const tileIndex = this.arrayBox.indexOf(this.lastClickedTileIndex);
        if (tileIndex === -1) return;

        this.addValueToTile(value, tileIndex, 'button');
      };

      element.addEventListener('click', handler);
      element.addEventListener('pointerdown', handler);
    };

    Array.from({ length: 10 }, (_, i) =>
      document.getElementById(`btn_kb_${i}`)
    ).forEach(btn => attachHandler(btn));
  }


  initMatrixDisplay = () => {
    const mojetteMatrix = document.getElementById('mojette-matrix');
    const splitContainer = document.getElementById('split-container');
    const binContainer = document.getElementById('bin-container');

    const scaleRatio = Math.min(400, 0.9 * window.innerWidth) / 400;

    mojetteMatrix?.style.setProperty('--scale-ratio', `${scaleRatio}`);
    splitContainer?.style.setProperty('--scale-ratio', `${scaleRatio}`);
    binContainer?.style.setProperty('--scale-ratio', `${scaleRatio}`);
    mojetteMatrix?.style.setProperty('opacity', `1`);
  };

  getDailyGrid(): void {
    this.mojetteService.getDailyGrid().subscribe((mojette: Mojette | null) => {
      if (mojette) {
        // Définir que c'est une grille du jour
        this.isCurrentGridDaily = true;
        this.initGrid(mojette);
      } else {
        console.error('No daily grid available');
        this.getGrid();
      }
    });
  }

  initGrid = (mojette: Mojette | null) => {
    if (!mojette) return;

    this.gridId = mojette.id;
    this.mojetteService.hasUserSolvedGrid(mojette.id).subscribe(
      //if the user has already solved the grid
      response => {
        this.hasBeenSolved = true;
        this.helpsUsed = response.helps_used;
        this.timeElapsed = response.completion_time;
        this.reward = response.reward;
      },
      () => {
        this.hasStarted = false;
        this.gridLevel = mojette.level;
        // this.gridId = mojette.id;
        this.height = mojette.height;
        this.width = mojette.width;
        this.gridShape = MojetteShapeTypes[mojette.shape_name];
        this.arrayBox = mojette.array_box;
        this.mjGridValues = Array(this.arrayBox.length).fill(-1);
        this.hasBeenSolved = false;
        this.helpsUsed = 0;
        this.helpCost = Math.floor(
          mojette.help_1_percent_cost * (mojette.reward / 100)
        );

        const nb_bin = [
          mojette.nb_bin_right,
          mojette.nb_bin_left,
          mojette.nb_bin_down,
        ];
        this.sidesOrder.forEach((e, i) => {
          this.bins[e] = mojette.bin_values.splice(0, nb_bin[i]);
        });

        this.bins['right'].reverse();

        this.currentBinDown = [...this.bins['down']];
        this.currentBinLeft = [...this.bins['left']];
        this.currentBinRight = [...this.bins['right']];

        this.initMojetteGrid();
        this.initBinValues();
        this.initGridInfo();
        this.initTimer();
        this.initMatrixDisplay();
        this.colorNumberButton();
      }
    );
  };

  private getGrid(): void {
    this.isCurrentGridDaily = false;
    this.mojetteService
      .getCurrentMojetteGrid()
      .subscribe((mojette: Mojette | null) => this.initGrid(mojette));
  }

  addBinToContainer = (
    container: HTMLElement,
    type: string,
    index: number,
    value: number
  ) => {
    const binDiv: HTMLDivElement = document.createElement('div');
    binDiv.className = 'binDiv';
    binDiv.id = `${type}Bin${index}`;
    binDiv.textContent = value.toString();
    type == 'left'
      ? binDiv.style.setProperty('transform', 'rotate(-135deg)')
      : null;
    type == 'right'
      ? binDiv.style.setProperty('transform', 'rotate(-45deg)')
      : null;
    container.appendChild(binDiv);
  };

  initBinValues = () => {
    this.sidesOrder.map((side: string) => {
      const container = document.getElementById(`${side}-bin-container`);
      if (container === null) return;
      this.bins[side].map((e, i) =>
        this.addBinToContainer(container, side, i, e)
      );
    });
  };

  createBox = (index: number): HTMLInputElement => {
    const matrixBox: HTMLInputElement = document.createElement('input');
    matrixBox.type = 'text';
    matrixBox.inputMode = 'numeric';
    matrixBox.id = `p${index}`;
    matrixBox.className = 'mojette-box pixel';
    matrixBox.autocomplete = 'off';
    // matrixBox.maxLength = 1;
    matrixBox.name = `pixel${index}`;
    matrixBox.onclick = this.onTileClick;
    matrixBox.oninput = this.onInput;
    return matrixBox;
  };

  createVoidDiv = (index: number) => {
    const matrixVoid: HTMLDivElement = document.createElement('div');
    matrixVoid.id = `v${index}`;
    matrixVoid.className = 'mojette-box void';
    matrixVoid.setAttribute('disabled', '');
    return matrixVoid;
  };

  initMojetteGrid = () => {
    const mojetteForm = document.getElementById('mojette-form');
    if (mojetteForm === null) return;
    mojetteForm.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;

    while (mojetteForm.firstChild) {
      mojetteForm.removeChild(mojetteForm.firstChild);
    }

    Array(this.height * this.width)
      .fill(0)
      .map((e, i) => {
        const newBox = this.arrayBox.includes(i)
          ? this.createBox(i)
          : this.createVoidDiv(i);
        mojetteForm.appendChild(newBox);
      });
    this.matriceContainer.nativeElement.appendChild(mojetteForm);
  };

  unmountMojetteGrid = () => {
    const mojetteForm = document.getElementById('mojette-form');
    if (mojetteForm === null) return;
    while (mojetteForm.firstChild)
      mojetteForm.removeChild(mojetteForm.firstChild);

    this.sidesOrder.map((side: string) => {
      const binContainer = document.getElementById(`${side}-bin-container`);
      if (binContainer === null) return;
      while (binContainer.firstChild)
        binContainer.removeChild(binContainer.firstChild);
    });
  };

  rightBinIndexFromTileIndex = (index: number) =>
    -3 + Math.floor(index / this.width) + (index % this.width);
  leftBinIndexFromTileIndex = (index: number) =>
    3 + Math.floor(index / this.width) - (index % this.width);

  downBinArrayFromTileIndex = (index: number) =>
    this.arrayBox.filter(
      e => e != index && e % this.width == index % this.width
    );
  rightBinArrayFromTileIndex = (index: number) =>
    this.arrayBox.filter(
      e =>
        e != index &&
        this.rightBinIndexFromTileIndex(e) ==
          this.rightBinIndexFromTileIndex(index)
    );
  leftBinArrayFromTileIndex = (index: number) =>
    this.arrayBox.filter(
      e =>
        e != index &&
        this.leftBinIndexFromTileIndex(e) ==
          this.leftBinIndexFromTileIndex(index)
    );

  onTileClick = (e: MouseEvent) => {
    const target = <HTMLInputElement>e.target;
    const targetId = parseInt(target.id.substring(1));

    this.colorSelectedTiles(targetId);
  };

  colorSelectedTiles = (tileId: number) => {
    const binCoords = {
      down: tileId % this.width,
      left: this.leftBinIndexFromTileIndex(tileId),
      right: this.rightBinIndexFromTileIndex(tileId),
    };

    const getSecondaryTiles = (index: number): Array<number> => {
      const arrayIdSecondaryDown = this.downBinArrayFromTileIndex(index);
      const arrayIdSecondaryLeft = this.leftBinArrayFromTileIndex(index);
      const arrayIdSecondaryRight = this.rightBinArrayFromTileIndex(index);
      return [
        arrayIdSecondaryDown,
        arrayIdSecondaryLeft,
        arrayIdSecondaryRight,
      ].flat();
    };

    if (this.lastClickedTileIndex != -1) {
      const lastBinCoords = {
        down: this.lastClickedTileIndex % this.width,
        left: this.leftBinIndexFromTileIndex(this.lastClickedTileIndex),
        right: this.rightBinIndexFromTileIndex(this.lastClickedTileIndex),
      };

      Object.entries(lastBinCoords).forEach(binCoord =>
        document
          .getElementById(`${binCoord[0]}Bin${binCoord[1]}`)
          ?.classList.remove('active')
      );
      document
        .getElementById(`p${this.lastClickedTileIndex}`)
        ?.classList.remove('active');
      getSecondaryTiles(this.lastClickedTileIndex).forEach(index =>
        document.getElementById(`p${index}`)?.classList.remove('secondary')
      );
    }
    Object.entries(binCoords).forEach(binCoord =>
      document
        .getElementById(`${binCoord[0]}Bin${binCoord[1]}`)
        ?.classList.add('active')
    );
    document.getElementById(`p${tileId}`)?.classList.add('active');

    getSecondaryTiles(tileId).forEach(index =>
      document.getElementById(`p${index}`)?.classList.add('secondary')
    );

    this.lastClickedTileIndex = tileId;
  };

  onInput = (e: Event) => {
    const ev = <InputEvent>e;
    const target = <HTMLInputElement>e.target;
    const targetId = parseInt(target.id.substring(1));

    const tileIndex = this.arrayBox.indexOf(targetId);

    if (ev.inputType == 'deleteContentBackward') {
      const value = this.mjGridValues[tileIndex];
      this.mjGridValues.splice(tileIndex, 1, -1);
      this.colorNumberButton();
      this.refreshBinValues(this.arrayBox[tileIndex]);
      if (this.mjGridValues.includes(value)) return;
    }

    if (ev.data === null) return;
    const value = parseInt(ev.data);
    this.addValueToTile(value, tileIndex, 'input');
    return;
  };

  addValueToTile = (value: number, tile: number, type: string) => {
    const selectedTile = <HTMLInputElement>(
      document.getElementById('p' + this.arrayBox[tile])
    );
    if (selectedTile === null) return;

    const currentTile =
      type == 'revert' ? this.arrayBox[tile] : this.lastClickedTileIndex;

    const isTileValid = (value: number): boolean => {
      const setValues = new Set(this.mjGridValues.filter(e => e != -1));
      if (isNaN(value) || value == -1) return false;
      if (this.mjGridValues.indexOf(value) != -1 || setValues.size < 3)
        return true;
      return false;
    };

    if (isTileValid(value)) {
      if (type != 'revert') this.addToHistory(tile);
      this.mjGridValues.splice(tile, 1, value);
      selectedTile.value = value.toString();
      if (!this.hasStarted) this.toggleTimer();
    }
    if (!isTileValid(value)) {
      const prevValue = this.mjGridValues.slice(tile, tile + 1)[0];
      if (prevValue != -1 && type != 'revert') this.addToHistory(tile);
      this.mjGridValues.splice(tile, 1, -1);
      selectedTile.value = '';
    }
    this.colorNumberButton();
    this.refreshBinValues(currentTile);
  };

  addToHistory = (tile: number): void => {
    if (this.changeHistory.length > 4)
      this.changeHistory = this.changeHistory.slice(1);
    this.changeHistory.push({
      tileID: tile,
      prevValue: this.mjGridValues[tile],
    });
    if (this.changeHistory.length) {
      document.getElementById('btn_kb_back')?.classList.remove('disabled');
    }
  };

  refreshBinValues = (index: number) => {
    const getSumOfTiles = (tilesIndexArray: Array<number>) =>
      tilesIndexArray
        .map(e =>
          parseInt((<HTMLInputElement>document.getElementById(`p${e}`)).value)
        )
        .reduce((acc, val) => (val ? acc + val : acc), 0);

    const downSumValues = getSumOfTiles(
      this.downBinArrayFromTileIndex(index).concat(index)
    );
    const leftSumValues = getSumOfTiles(
      this.leftBinArrayFromTileIndex(index).concat(index)
    );
    const rightSumValues = getSumOfTiles(
      this.rightBinArrayFromTileIndex(index).concat(index)
    );

    const binIndexes = [
      index % this.width,
      this.leftBinIndexFromTileIndex(index),
      this.rightBinIndexFromTileIndex(index),
    ];
    const newBinDown = this.bins['down'][binIndexes[0]] - downSumValues;
    const newBinLeft = this.bins['left'][binIndexes[1]] - leftSumValues;
    const newBinRight = this.bins['right'][binIndexes[2]] - rightSumValues;

    this.currentBinDown[binIndexes[0]] = newBinDown;
    this.currentBinLeft[binIndexes[1]] = newBinLeft;
    this.currentBinRight[binIndexes[2]] = newBinRight;

    const downBinDiv = document.getElementById(`downBin${binIndexes[0]}`);
    if (downBinDiv === null) return;
    downBinDiv.textContent = newBinDown.toString();
    newBinDown == 0
      ? downBinDiv.classList.add('valid')
      : downBinDiv.classList.remove('valid');

    const leftBinDiv = document.getElementById(`leftBin${binIndexes[1]}`);
    if (leftBinDiv === null) return;
    leftBinDiv.textContent = newBinLeft.toString();
    newBinLeft == 0
      ? leftBinDiv.classList.add('valid')
      : leftBinDiv.classList.remove('valid');

    const rightBinDiv = document.getElementById(`rightBin${binIndexes[2]}`);
    if (rightBinDiv === null) return;
    rightBinDiv.textContent = newBinRight.toString();
    newBinRight == 0
      ? rightBinDiv.classList.add('valid')
      : rightBinDiv.classList.remove('valid');

    if (this.isGridValid()) {
      clearInterval(this.timer);
      this.mojetteService
        .postSolvedMojette(
          this.gridId,
          this.mjGridValues,
          this.helpsUsed,
          this.timeElapsed
        )
        .subscribe(response => {
          this.reward = response.reward;
          this.authService.sendUpdateMojette(response.mojettes);
          // this.updateMojetteInStorage(response.mojettes as number);

          if (this.selectedLevel !== '4') {
            this.availableGridsByLevel[this.selectedLevel].forEach(grid => {
              if (grid.id == this.gridId) {
                grid.solved = true;
              }
            });
          } else if (this.isCurrentGridDaily) {
            const dayKey = (this.activeDailyDay ?? this.todayDayNumber).toString();
            this.dailyGridCompletionStatus[dayKey] = true;
          }

          // this.unmountMojetteGrid();
          const mojetteMatrix = document.getElementById('mojette-matrix');
          // mojetteMatrix?.style.setProperty('opacity', `0`);

          this.showFinishedGrid = true;
          // Trigger confetti animation on successful completion
          this.confettiService.trigger();
        });
    }
  };

  toggleTimer = (): void => {
    const startButton = document.getElementById('timer-btn');
    const timerSpan = document.getElementById('timer-span');
    if (startButton === null) return;
    if (timerSpan === null) return;
    if (this.hasStarted) {
      this.resetGrid();
      clearInterval(this.timer);
      timerSpan.textContent = this.updateTimerDisplay(0);
    }
    if (!this.hasStarted) {
      this.timeElapsed = 0;
      this.timer = setInterval(() => {
        this.timeElapsed++;
        timerSpan.textContent = this.updateTimerDisplay(this.timeElapsed);
      }, 1000);
    }

    startButton.textContent = this.hasStarted ? 'Start' : 'Reset';
    this.hasStarted = !this.hasStarted;
  };

  initTimer = (): void => {
    this.timeElapsed = 0;
    clearInterval(this.timer);
    const startButton = document.getElementById('timer-btn');
    const timerSpan = document.getElementById('timer-span');
    if (startButton === null) return;
    if (timerSpan === null) return;
    startButton.textContent = 'Start';
    timerSpan.textContent = this.updateTimerDisplay(0);
  };

  resetGrid = (): void => {
    this.mjGridValues = Array(this.arrayBox.length).fill(-1);
    this.arrayBox.forEach((e, i) => {
      this.addValueToTile(-1, i, 'revert');
    });
    this.resetBins();
    this.changeHistory = [];
  };

  resetBins = (): void => {
    this.sidesOrder.forEach(side => {
      const binContainer = document.getElementById(`${side}-bin-container`);
      if (binContainer === null) return;
      Array.from(binContainer.children).forEach((el, i) => {
        el.classList.remove('valid', 'active');
        el.textContent = this.bins[side][i].toString();
      });
    });
  };

  isGridValid = (): boolean => {
    return (
      this.mjGridValues.filter(e => e != -1).length == this.arrayBox.length &&
      this.currentBinDown.every(e => e == 0) &&
      this.currentBinLeft.every(e => e == 0) &&
      this.currentBinRight.every(e => e == 0)
    );
  };

  colorNumberButton = (): void => {
    const setValues = new Set(this.mjGridValues.filter(e => e != -1));
    Array(10)
      .fill(0)
      .forEach((e, i) => {
        const button = document.getElementById(
          'btn_kb_' + i
        ) as HTMLButtonElement;
        setValues.has(i)
          ? button.classList.add('active')
          : button.classList.remove('active');
      });
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

  initGridInfo = (): void => {
    const spanInfo = document.getElementById(`grid-info-span`);
    if (spanInfo === null) return;
    if (this.gridLevel == -1) return;
    if (this.gridId == -1) return;

    if (this.isCurrentGridDaily) {
      // Titre pour les grilles du jour
      spanInfo.textContent = `GRILLE DU JOUR - ${this.levelName[Math.max(0, this.gridLevel - 1)].toUpperCase()}`;
      spanInfo.classList.add('daily-grid');
    } else {
      // Titre pour les grilles classiques
      spanInfo.textContent = `${this.levelName[Math.max(0, this.gridLevel - 1)].toUpperCase()}`;
      spanInfo.classList.remove('daily-grid');
    }
  };

  checkSwipeDirection(touchstartY: number, touchendY: number) {
    if (touchendY < touchstartY) return 1;
    if (touchendY > touchstartY) return -1;
    return 0;
  }

  handleHelpSwipe = (): void => {
    const helpDialog = document.getElementById('helpDialog');
    let touchstartY = 0;
    let touchendY = 0;

    helpDialog?.addEventListener('touchstart', e => {
      touchstartY = e.changedTouches[0].screenY;
    });

    helpDialog?.addEventListener('touchend', e => {
      touchendY = e.changedTouches[0].screenY;
      const indexChange = this.checkSwipeDirection(touchstartY, touchendY);
      if (indexChange == 1) this.isHelpOpen = false;
      return;
    });
  };

  onSelectChange = () => {
    const isDaily = this.selectedLevel === '4';

    this.currentNbGrid = this.availableGridsByLevel[this.selectedLevel];
    this.nextNbGrid = this.availableGridsByLevel[this.selectedLevel];
    setTimeout(() => {
      const containerId = isDaily
        ? 'daily-scroll-container'
        : 'scroll-container';
      const scrollContainer = document.getElementById(containerId);

      if (scrollContainer) {
        scrollContainer.classList.add('animate');

        setTimeout(() => {
          scrollContainer.classList.remove('animate');
        }, 800);
      }
    }, 0);
  };

  playGrid = (index: number) => {
    this.activeDailyDay = null;
    this.isCurrentGridDaily = false;
    const selectedGrid = this.nextNbGrid[index];
    if (!selectedGrid) return;

    const navigateToLeaderboard = () => {
      this.router.navigate(['/leaderboard'], {
        queryParams: { gridId: selectedGrid.id },
      });
    };

    const loadGrid = () => {
      this.mojetteService
        .getNthLastMojetteGridByLevel(index, this.selectedLevel)
        .subscribe((mojette: Mojette | null) => this.initGrid(mojette));
    };

    if (selectedGrid.solved === true) {
      navigateToLeaderboard();
      return;
    }

    loadGrid();
  };

  playDailyGrid(day: number) {
    this.activeDailyDay = day;
    const completionKey = day.toString();
    const completionStatus = this.dailyGridCompletionStatus[completionKey];

    const handleGrid = (mojette: Mojette | null) => {
      if (!mojette || mojette.id === undefined) return;

      const redirect = () => {
        this.dailyGridCompletionStatus[completionKey] = true;
        this.router.navigate(['/leaderboard'], {
          queryParams: { gridId: mojette.id },
        });
      };

      const load = () => {
        this.activeDailyDay = day;
        this.dailyGridCompletionStatus[completionKey] = false;
        this.isCurrentGridDaily = true;
        this.initGrid(mojette);
      };

      if (completionStatus === true) {
        redirect();
        return;
      }

      if (completionStatus === false) {
        load();
        return;
      }

      load();
    };

    if (day === this.todayDayNumber) {
      this.mojetteService.getDailyGrid().subscribe(handleGrid);
    } else {
      this.mojetteService.getDailyGridid(day).subscribe(handleGrid);
    }
  }

  goToGridBrowse = (): void => {
    this.unmountMojetteGrid();
    this.hasBeenSolved = true;
    this.gridId = 0;
  };

  goToHomePage = (): void => {
    this.router.navigate(['/']);
  };

  goToTutorial = (): void => {
    this.router.navigate(['/mojette-tutorial']);
  };
}
