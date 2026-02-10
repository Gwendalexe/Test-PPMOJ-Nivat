import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lostPasswordComponent } from './lost_password.component';

describe('lostPasswordComponent', () => {
  let component: lostPasswordComponent;
  let fixture: ComponentFixture<lostPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [lostPasswordComponent],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(lostPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
