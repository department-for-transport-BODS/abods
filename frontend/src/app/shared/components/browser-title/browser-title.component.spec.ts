import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from '../../shared.module';
import { BrowserTitleComponent } from './browser-title.component';

describe('BrowserTitleComponent', () => {
  let component: BrowserTitleComponent;
  let fixture: ComponentFixture<BrowserTitleComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [BrowserTitleComponent],
        imports: [SharedModule, LayoutModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowserTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
