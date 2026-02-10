import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MojetteTutorialComponent } from './mojette-tutorial.component';

describe('MojetteTutorialComponent', () => {
  let component: MojetteTutorialComponent;
  let fixture: ComponentFixture<MojetteTutorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MojetteTutorialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MojetteTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
