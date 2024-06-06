import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { NavService } from './nav.service';

describe('NavService', () => {
  let spectator: SpectatorService<NavService>;
  const createService = createServiceFactory(NavService);

  beforeEach(() => {
    spectator = createService();
  });

  it('should create the service', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should toggle the menu and update isOpen', () => {
    expect(spectator.service.isOpen).toBe(false);

    spectator.service.toggleMenu();

    expect(spectator.service.isOpen).toBe(true);
  });

  it('should close the menu and update isOpen', () => {
    spectator.service.isOpen = true;

    spectator.service.closeMenu();

    expect(spectator.service.isOpen).toBe(false);
  });

  it('should toggle the menu when selected element is not "nav-toggle" and isOpen is true', () => {
    spectator.service.isOpen = true;

    const selectedEl = document.createElement('div');
    selectedEl.id = 'other-element';

    spectator.service.navClickOutside(selectedEl);

    expect(spectator.service.isOpen).toBe(false);
  });

  it('should not toggle the menu when selected element is "nav-toggle"', () => {
    spectator.service.isOpen = true;

    const selectedEl = document.createElement('div');
    selectedEl.id = 'nav-toggle';

    spectator.service.navClickOutside(selectedEl);

    expect(spectator.service.isOpen).toBe(true);
  });

  it('should not toggle the menu when isOpen is false', () => {
    spectator.service.isOpen = false;

    const selectedEl = document.createElement('div');
    selectedEl.id = 'other-element';

    spectator.service.navClickOutside(selectedEl);

    expect(spectator.service.isOpen).toBe(false);
  });
});
