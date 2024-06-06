import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionListActionComponent } from './actionlist-action.component';

describe('ActionListActionComponent', () => {
  let component: ActionListActionComponent;
  let fixture: ComponentFixture<ActionListActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActionListActionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionListActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
