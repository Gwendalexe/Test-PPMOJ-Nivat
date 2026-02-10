import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Mojette, MojetteShapeTypes } from 'src/app/_models/Mojette';
import { User } from 'src/app/_models/User';
import { AuthService } from 'src/app/_services/auth.service';
import { MojetteService } from 'src/app/_services/mojette.service';
import { LeaderboardTableComponent } from 'src/app/components/leaderboard-table/leaderboard-table.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { tutorialSteps } from './mojette-tutorial-steps';

@Component({
  selector: 'app-mojette-tutorial',
  host: { class: 'dark-theme' },
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule,
      FormsModule,
      ReactiveFormsModule,
      MatSelectModule,
      MatFormFieldModule,
      MatProgressBarModule,
      NavbarComponent,
      LeaderboardTableComponent
    ],
  templateUrl: './mojette-tutorial.component.html',
  styleUrl: './mojette-tutorial.component.scss'
})
export class MojetteTutorialComponent {

  @ViewChild('matriceContainer') matriceContainer!: ElementRef;

  STEP: number = 0;
  mojettes: number = 0;
  lastActiveTiles: number[] = [];
  lastActiveBins: Array<[string, number]> = [];
  lastValueTiles: number[] = [];
  solution: number[] = [0, 1, 1, 0, 6, 1, 0, 0, 1, 0, 6, 0, 0, 0, 1, 1, 6, 1, 0, 0, 1, 0, 0, 0];
  validStep: boolean = true;
  tutorialSteps = tutorialSteps;

  currentUser: User;
  rerender = false;
  hasStarted = false;
  timer: any;
  timeElapsed = 0;

  hasBeenSolved = false;
  isHelpOpen = false;
  selectedLevel = '1';
  showFinishedGrid = false;
  dailyGridDays: number[] = [];
  todayDayNumber: number = new Date().getDate();
  dailyGridCompletionStatus: Record<string, boolean> = {};
  isCurrentGridDaily: boolean = false;

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
    private router: Router,
    private authService: AuthService,
    private mojetteService: MojetteService
  ) {}

  private getGridSize(): number {
    if (this.width && this.height) {
      return this.width * this.height;
    }

    if (this.arrayBox.length > 0) {
      return Math.max(...this.arrayBox) + 1;
    }

    return 0;
  }

  private resetMjGridValues(): void {
    const gridSize = this.getGridSize();
    this.mjGridValues = gridSize ? Array(gridSize).fill(-1) : [];
  }

  async updateStep(step: number) {
    this.resetBins(false);
    this.validStep = true;
    if (step < 0 || step >= this.tutorialSteps.length) return;

    if (step <= 7)
      this.resetMjGridValues();

    this.STEP = step;
    const current = this.tutorialSteps[step];

    this.setActiveGrid(current.gridVisible);
    this.setTileNumbers(current.tileNumbers);
    this.setActiveTiles(current.tilesToFill);
    this.setActiveBins(current.bins);
    this.toggleGridEnabled(current.gridActive, current.tilesToFill);
    this.toggleBinEnabled(current.gridVisible, current.hideBin);
  }

  nextStep() {
    const activeTiles = this.tutorialSteps[this.STEP].tilesToFill;
    if (activeTiles.length > 0 && this.tutorialSteps[this.STEP].gridActive) {
      this.validStep = this.checkTilesResult(activeTiles);
    }
    if (this.validStep && this.STEP < this.tutorialSteps.length - 1) {
      this.updateStep(this.STEP + 1);
    }
  }

  restart() {
    if (this.STEP > 0) {
      location.reload();
    }
  }

  ngOnInit(): void {
    const userStored = localStorage.getItem('currentUser');
    if (userStored === null) return;
    this.currentUser = JSON.parse(userStored);
  }

  colorBin(number: number, direction: string, color: string = 'red') {
    const id = `${direction}Bin${number}`;
    const element = document.getElementById(id);
    if (element) {
      element.style.setProperty('color', '#D972FF', 'important');
    } else {
      console.warn(`Element with id ${id} not found`);
    }
  }

  checkStepComplete() {
    if (this.checkTilesResult(this.tutorialSteps[this.STEP].tilesToFill)) {
      this.nextStep();
    }
  }

  ngAfterViewInit(): void {
    this.getTutorialGrid().subscribe((mojette: Mojette | null) => {
      if (mojette) {
        this.isCurrentGridDaily = true;
        this.initGrid(mojette).then(() => {
          this.handleHelpSwipe();
          this.updateStep(0);
        });
      } else {
        console.error('No grid available');
      }
    });

    setTimeout(() => {
      const splitContainerDiv = document.getElementById('split-container');
      if (!splitContainerDiv) return;
      const splitsStylesDict: Array<string> = [
      'downSplit',
      'leftSplit',
      'rightSplit',
      ];

      splitsStylesDict.forEach(id => {
        const splitDiv = document.createElement('div');
        splitDiv.id = id;
        splitDiv.classList.add('split');
        splitContainerDiv.appendChild(splitDiv);
      });
    }, 0);

    const revertButton = document.getElementById('btn_kb_back');
    if (revertButton === null) return;
    revertButton.onclick = () => revertChange();

    const onButtonClick = (e: Event) => {
      const target = <HTMLButtonElement>e.target;
      if (this.lastClickedTileIndex == -1) return;
      const value = parseInt(target.id.split('_').slice(-1)[0]);
      const tileIndex = this.lastClickedTileIndex;
      this.addValueToTile(value, tileIndex, 'button');
      this.checkStepComplete();
    };
    Array(10)
      .fill(0)
      .map((e, i) => {
        const btnKeyboard = document.getElementById(`btn_kb_${i}`);
        if (btnKeyboard === null) return;
        btnKeyboard.onclick = onButtonClick;
      });

    const revertChange = () => {
      if (!this.changeHistory.length) return;
      const lastChange = this.changeHistory.pop();
      if (lastChange === undefined) return;
      this.addValueToTile(lastChange.prevValue, lastChange.tileID, 'revert');
      if (!this.changeHistory.length)
        document.getElementById('btn_kb_back')?.classList.add('disabled');
    };
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

  getTutorialGrid(): Observable<Mojette | null> {
    return this.mojetteService.getGridById(1003090);
  }

  initGrid = (mojette: Mojette | null): Promise<void> => {
    return new Promise((resolve) => {
      if (!mojette) {
        resolve(); // On résout immédiatement si mojette est null
        return;
      }

      this.gridId = mojette.id;

      this.hasStarted = false;
      this.gridLevel = mojette.level;
      this.height = mojette.height;
      this.width = mojette.width;
      this.gridShape = MojetteShapeTypes[mojette.shape_name];
      this.arrayBox = mojette.array_box;
      this.resetMjGridValues();
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

      resolve();
    });
  };

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

  toggleGridEnabled(enabled: boolean, enabledTiles: number[] = []): void {
    const keyboard = document.getElementById('keyboard') as HTMLInputElement;
    keyboard.style.visibility = enabled ? 'visible' : 'hidden';

    this.arrayBox.forEach(tileIndex => {
      const tileElement = document.getElementById(`p${tileIndex}`) as HTMLInputElement;

      if (tileElement) {
        const shouldEnable = enabled && enabledTiles.includes(tileIndex);
        tileElement.disabled = !shouldEnable;
        tileElement.classList.toggle('disabled', !shouldEnable); // style optionnel
      }
    });
  }

  toggleBinEnabled(gridVisible: boolean, hideBin: boolean): void {
    if (gridVisible) {
      const leftBin = document.getElementById('left-bin-container') as HTMLInputElement;
      const rightBin = document.getElementById('right-bin-container') as HTMLInputElement;
      const downBin = document.getElementById('down-bin-container') as HTMLInputElement;
      leftBin.style.visibility = hideBin ? 'hidden' : 'visible';
      rightBin.style.visibility = hideBin ? 'hidden' : 'visible';
      downBin.style.visibility = hideBin ? 'hidden' : 'visible';
    }
  }

  checkTilesResult(activeTiles: number[]): boolean {
    let allCorrect = true;

    activeTiles.forEach(tileId => {
      const tileIndexInArrayBox = this.arrayBox.indexOf(tileId);
      if (tileIndexInArrayBox === -1) return;

      const tileElement = document.getElementById('p' + tileId) as HTMLInputElement;
      if (!tileElement) return;

      const userValue = tileElement.value.toString();
      const expectedValue = this.solution[tileIndexInArrayBox].toString();

      if (userValue !== expectedValue) {
        this.colorSelectedTiles(tileId, false);
        allCorrect = false;
      }
    });

    return allCorrect;
  }

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

    this.colorSelectedTiles(targetId, false);
  };

  colorSelectedTiles = (tileId: number, colorSecondary: boolean) => {
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
    }
    Object.entries(binCoords).forEach(binCoord =>
      document
        .getElementById(`${binCoord[0]}Bin${binCoord[1]}`)
        ?.classList.add('active')
    );
    if (colorSecondary) {
      document.getElementById(`p${tileId}`)?.classList.add('active');

      getSecondaryTiles(tileId).forEach(index =>
        document.getElementById(`p${index}`)?.classList.add('secondary')
      );
    }
    this.lastClickedTileIndex = tileId;
  };

  setActiveBins(binCoords: Array<[string, number]>) {
    this.lastActiveBins.forEach(([dir, index]) => {
      const bin = document.getElementById(`${dir}Bin${index}`);
      if (bin) {
        bin.classList.remove('active', 'bold');
      }
    });

    binCoords.forEach(([dir, index]) => {
      const el = document.getElementById(`${dir}Bin${index}`);
      if (el) {
        el.classList.add('active');
        el.classList.add('bold');
      }
    });

    this.lastActiveBins = binCoords;
  }

  setActiveTiles(tileIds: number[]) {
    this.lastActiveTiles.forEach(id => {
      document.getElementById(`p${id}`)?.classList.remove('active');
    });

    tileIds.forEach(id => {
      const el = document.getElementById(`p${id}`);
      if (el) {
        el.classList.add('active');
      }
    });

    // Met à jour le cache
    this.lastActiveTiles = tileIds;
  }

  setTileNumbers(tiles: { tileId: number; value: number; color?: string }[]) {
    this.lastValueTiles.forEach(tileIndex => {
      this.addValueToTile(-1, tileIndex, 'revert', ''); // reset tile (supprime valeur)
    });

    tiles.forEach(({ tileId, value, color }) => {
      this.addValueToTile(value, tileId, 'input', color, true);
    });

    this.lastValueTiles = tiles.map(t => t.tileId);
  }

  setActiveGrid(visible: boolean) {
    document.getElementById('mojette-matrix')!.style.display = visible ? '' : 'none';
  }

  onInput = (e: Event) => {
    const ev = <InputEvent>e;
    const target = <HTMLInputElement>e.target;
    const targetId = parseInt(target.id.substring(1));

    const tileIndex = targetId;

    if (ev.inputType == 'deleteContentBackward') {
      const value = this.mjGridValues[tileIndex];
      this.mjGridValues.splice(tileIndex, 1, -1);
      this.colorNumberButton();
      this.refreshBinValues(tileIndex);
      if (this.mjGridValues.includes(value)) return;
    }

    if (ev.data === null) return;
    const value = parseInt(ev.data);
    this.addValueToTile(value, tileIndex, 'input');

    this.checkStepComplete();

    return;
  };

  addValueToTile = (value: number, tile: number, type: string, color?: string, force?: boolean) => {
    const selectedTile = <HTMLInputElement>(
      document.getElementById('p' + tile)
    );
    if (selectedTile === null) return;

    const isTileValid = (value: number): boolean => {
      const setValues = new Set(this.mjGridValues.filter(e => e != -1));
      if (isNaN(value) || value == -1) return false;
      if (this.mjGridValues.indexOf(value) != -1 || setValues.size < 3)
        return true;
      return false;
    };

    if (isTileValid(value) || force) {
      if (type != 'revert') this.addToHistory(tile);
      this.mjGridValues.splice(tile, 1, value);
      selectedTile.value = value.toString();
      if (!this.hasStarted) this.toggleTimer();
    } else if (!isTileValid(value)) {
      const prevValue = this.mjGridValues.slice(tile, tile + 1)[0];
      if (prevValue != -1 && type != 'revert') this.addToHistory(tile);
      this.mjGridValues.splice(tile, 1, -1);
      selectedTile.value = '';
    }

    selectedTile.style.backgroundColor = color ? color : '';
    this.colorNumberButton();
    this.refreshBinValues(tile);
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

    const leftBinDiv = document.getElementById(`leftBin${binIndexes[1]}`);
    if (leftBinDiv === null) return;
    leftBinDiv.textContent = newBinLeft.toString();

    const rightBinDiv = document.getElementById(`rightBin${binIndexes[2]}`);
    if (rightBinDiv === null) return;
    rightBinDiv.textContent = newBinRight.toString();

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

          if (this.selectedLevel !== '4') {
            this.availableGridsByLevel[this.selectedLevel].forEach(grid => {
              if (grid.id == this.gridId) {
                grid.solved = true;
              }
            });
          }

          const mojetteMatrix = document.getElementById('mojette-matrix');

          this.showFinishedGrid = true;
        });
    }
  };

  endGrid() {
    clearInterval(this.timer);
    this.mojetteService.postSolvedMojette(
      this.gridId,
      this.mjGridValues,
      this.helpsUsed,
      this.timeElapsed).subscribe(response => {
        this.mojettes = response.mojettes;
        this.authService.sendUpdateMojette(response.mojettes);
    });

    this.updateUserTutorialDone().subscribe({
      next: () => {
        this.goToGame();
      },
      error: (error) => {
        console.error('Failed to update user', error);
      }
    });
  }

  skipTutorial() {
    this.updateUserTutorialDone().subscribe({
      next: () => {
        this.goToGame();
      },
      error: (error) => {
        console.error('Failed to update user', error);
      }
    });
  }

  updateUserTutorialDone(): Observable<any> {
    this.currentUser.tutorial_mojette_done = true;
    const payload = {
      tutorial_mojette_done: 'true'
    };

    return this.authService.updateUserById(this.currentUser?.id as number, payload).pipe(
      tap(() => {
        this.currentUser.tutorial_mojette_done = true;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      })
    );
  }

  goToGame() {
    this.router.navigate(['/mojette']);
  }

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
    this.resetMjGridValues();
    this.arrayBox.forEach(tileId => {
      this.addValueToTile(-1, tileId, 'button');
    });
    this.resetBins(true);
    this.changeHistory = [];
  };

  resetBins = (resetNumber: boolean): void => {
    this.sidesOrder.forEach(side => {
      const binContainer = document.getElementById(`${side}-bin-container`);
      if (binContainer === null) return;
      Array.from(binContainer.children).forEach((el, i) => {
        el.classList.remove('valid', 'active');
        if (resetNumber) {
          el.textContent = this.bins[side][i].toString();
        }
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
    spanInfo.textContent = `TUTORIEL`;
    spanInfo.classList.add('daily-grid');
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

  goToGridBrowse = (): void => {
    this.unmountMojetteGrid();
    this.hasBeenSolved = true;
    this.gridId = 0;
  };

  goToHomePage = (): void => {
    this.router.navigate(['/']);
  };
}
