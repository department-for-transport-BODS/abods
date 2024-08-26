import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { NoRowsOverlayComponent, NoRowsOverlayParams } from './no-rows-overlay.component';

describe('NoRowsOverlayComponent', () => {
  let spectator: Spectator<NoRowsOverlayComponent>;
  let component: NoRowsOverlayComponent;

  const createComponent = createComponentFactory({
    component: NoRowsOverlayComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it('should show no matches message when mode set', () => {
    component.agInit(<NoRowsOverlayParams>{ message: 'Computer says no' });
    spectator.detectChanges();

    expect(spectator.query(byText('Computer says no'))).toBeVisible();
  });
});
