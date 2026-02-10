import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarreDudeneyComponent } from './carre_dudeney.component';

describe('CoteCarreComponent', () => {
  let component: CarreDudeneyComponent;
  let fixture: ComponentFixture<CarreDudeneyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [CarreDudeneyComponent],
});
    fixture = TestBed.createComponent(CarreDudeneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
