import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedefineComponent } from './redefine.component';

describe('RedefineComponent', () => {
  let component: RedefineComponent;
  let fixture: ComponentFixture<RedefineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedefineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedefineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
