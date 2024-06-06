import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { LinkComponent } from './link.component';

describe('LinkComponent', () => {
  let spectator: Spectator<LinkComponent>;
  let component: LinkComponent;

  const createComponent = createComponentFactory({
    component: LinkComponent,
    imports: [RouterTestingModule],
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
