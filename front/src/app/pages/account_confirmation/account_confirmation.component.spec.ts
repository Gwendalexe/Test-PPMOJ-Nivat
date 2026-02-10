import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountConfirmation } from './account_confirmation.component';

describe('accountConfirmation', () => {
  let component: AccountConfirmation;
  let fixture: ComponentFixture<AccountConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AccountConfirmation],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
