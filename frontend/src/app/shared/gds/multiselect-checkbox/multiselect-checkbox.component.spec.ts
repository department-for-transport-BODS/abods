import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiselectCheckboxComponent } from './multiselect-checkbox.component';

describe('MultiselectCheckboxComponent', () => {
  let component: MultiselectCheckboxComponent;
  let fixture: ComponentFixture<MultiselectCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiselectCheckboxComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiselectCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onShowAll', () => {
    it('should clear all selected option', () => {
      component.selected = ['1', '2', '3'];
      component.onShowAll();

      expect(component.selected).toEqual([]);
    });

    it('should emit empty array', () => {
      spyOn(component.selectedChange, 'emit');
      component.selected = ['1', '2', '3'];
      component.onShowAll();

      expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('onOptionChange', () => {
    it('should emit selected options', () => {
      spyOn(component.selectedChange, 'emit');
      component.selected = ['1', '2', '3'];
      component.onOptionChange();

      expect(component.selectedChange.emit).toHaveBeenCalledWith(component.selected);
    });
  });
});
