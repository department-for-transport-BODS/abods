import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LayoutModule } from '../layout/layout.module';

import { CorridorsComponent } from './corridors.component';

describe('CorridorsComponent', () => {
  let component: CorridorsComponent;
  let fixture: ComponentFixture<CorridorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorridorsComponent],
      imports: [LayoutModule, RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CorridorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
