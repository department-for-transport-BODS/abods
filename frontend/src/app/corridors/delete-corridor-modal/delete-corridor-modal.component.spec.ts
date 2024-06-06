import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from '../../shared/gds/button/button.component';
import { Corridor } from '../corridors.service';

import { DeleteCorridorModalComponent } from './delete-corridor-modal.component';

describe('DeleteCorridorModalComponent', () => {
  let component: DeleteCorridorModalComponent;
  let fixture: ComponentFixture<DeleteCorridorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeleteCorridorModalComponent, ButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteCorridorModalComponent);
    component = fixture.componentInstance;
    component.corridor = <Corridor>{
      name: 'Test Corridor',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show corridor name in message', () => {
    const el = fixture.nativeElement.querySelector('.govuk-body').innerHTML;

    expect(el).toContain('Test Corridor');
  });

  it('should emit deleteCorridor when delete button clicked', () => {
    spyOn(component.deleteCorridor, 'emit');
    const el = fixture.nativeElement.querySelector('.govuk-button--warning');
    el.click();

    expect(component.deleteCorridor.emit).toHaveBeenCalledWith(component.corridor);
  });
});
