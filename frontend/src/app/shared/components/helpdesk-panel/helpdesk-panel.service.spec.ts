import { HelpdeskPanelService } from './helpdesk-panel.service';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { DOCUMENT } from '@angular/common';

describe('HelpdeskPanelService', () => {
  let spectator: SpectatorService<HelpdeskPanelService>;
  let service: HelpdeskPanelService;
  let document: Document;

  const serviceFactory = createServiceFactory({
    service: HelpdeskPanelService,
  });

  beforeEach(() => {
    spectator = serviceFactory();
    service = spectator.service;
    document = spectator.inject(DOCUMENT);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should open', () => {
    spyOn(document.body.classList, 'add');
    service.open();

    expect(document.body.classList.add).toHaveBeenCalledWith('helpdesk-open');
    expect(service.isOpen).toBeTrue();
  });

  it('should close', () => {
    spyOn(document.body.classList, 'remove');
    service.close();

    expect(document.body.classList.remove).toHaveBeenCalledWith('helpdesk-open');
    expect(service.isOpen).toBeFalse();
  });
});
