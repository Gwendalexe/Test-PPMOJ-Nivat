import { AfterViewInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-carrousel',
  imports: [],
  host: { '(wheel)': 'scrollGameCards($event)' },
  templateUrl: './carrousel.component.html',
  styleUrl: './carrousel.component.scss',
})
export class CarrouselComponent implements AfterViewInit {
  carrousel: HTMLElement;
  carrouselActiveItem = 1;

  constructor(private ref: ElementRef) {
    this.carrousel = ref.nativeElement;
  }

  ngAfterViewInit() {
    this.handleCarousel();
  }

  checkSwipeDirection(touchstartX: number, touchendX: number): number {
    if (touchendX < touchstartX) return 1;
    if (touchendX > touchstartX) return -1;
    return 0;
  }

  scrollGameCards = (event: WheelEvent) => {
    if (event.deltaY > 0) return this.moveActiveCard(1);
    if (event.deltaY < 0) return this.moveActiveCard(-1);
    return;
  };

  styleCarouselElement = () => {
    const carouselItems: Element[] = Array.from(this.carrousel.children);
    Array.from(carouselItems).forEach((el, i) => {
      (el as HTMLElement).style['left'] =
        `${(1 - this.carrouselActiveItem) * el.clientWidth}px`;
      this.carrouselActiveItem == i
        ? el.classList.add('active')
        : el.classList.remove('active');
    });
  };

  moveActiveCard = (direction: number) => {
    const carouselItems: Element[] = Array.from(this.carrousel.children);
    this.carrouselActiveItem =
      (this.carrouselActiveItem + direction + carouselItems.length) %
      carouselItems.length;
    this.styleCarouselElement();
  };

  handleCarousel = () => {
    let touchstartX = 0;
    let touchendX = 0;

    this.carrousel?.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].screenX;
    });

    this.carrousel?.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      const indexChange = this.checkSwipeDirection(touchstartX, touchendX);
      this.moveActiveCard(indexChange);
    });

    this.styleCarouselElement();
  };
}
