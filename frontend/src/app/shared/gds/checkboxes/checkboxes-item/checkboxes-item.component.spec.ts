import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckboxesItemComponent } from './checkboxes-item.component';

describe('CheckboxesItemComponent', () => {
  let component: CheckboxesItemComponent;
  let fixture: ComponentFixture<CheckboxesItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckboxesItemComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckboxesItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
