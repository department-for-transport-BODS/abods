import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorNotFoundComponent } from './operator-not-found.component';

describe('OperatorNotFoundComponent', () => {
  let component: OperatorNotFoundComponent;
  let fixture: ComponentFixture<OperatorNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperatorNotFoundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperatorNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
