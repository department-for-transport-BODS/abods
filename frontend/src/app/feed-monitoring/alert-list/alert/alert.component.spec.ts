import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { fakeEvent } from 'src/test-support/faker';
import { AlertMode, AlertListViewModel } from '../alert-list-view-model';

import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AlertComponent],
      imports: [SharedModule, LayoutModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.alert = new AlertListViewModel(
      fakeEvent({ start: DateTime.local().minus({ hour: 1 }), end: DateTime.local() }),
      AlertMode.LiveStatus
    );
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
});
