import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VefComponent } from './vef.component';

describe('GameComponent', () => {
  let component: VefComponent;
  let fixture: ComponentFixture<VefComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [VefComponent],
});
    fixture = TestBed.createComponent(VefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
