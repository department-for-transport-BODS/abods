import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionListSectionComponent } from './actionlist-section.component';

describe('ActionListSectionComponent', () => {
  let component: ActionListSectionComponent;
  let fixture: ComponentFixture<ActionListSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActionListSectionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionListSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
