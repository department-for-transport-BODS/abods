import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FeedStatusSingleComponent } from './feed-status-single.component';

describe('FeedStatusComponent', () => {
  let spectator: Spectator<FeedStatusSingleComponent>;
  let component: FeedStatusSingleComponent;

  const createComponent = createComponentFactory({
    component: FeedStatusSingleComponent,
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
