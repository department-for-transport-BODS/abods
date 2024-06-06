import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FeedStatusSummaryComponent } from './feed-status-summary.component';

describe('FeedStatusSummaryComponent', () => {
  let spectator: Spectator<FeedStatusSummaryComponent>;
  let component: FeedStatusSummaryComponent;

  const createComponent = createComponentFactory({
    component: FeedStatusSummaryComponent,
    imports: [LayoutModule, SharedModule, RouterTestingModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });
});
