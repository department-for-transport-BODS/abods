import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { OrganisationService } from './organisation.service';

describe('OrganisationService', () => {
  let spectator: SpectatorService<OrganisationService>;
  const createService = createServiceFactory({ service: OrganisationService, imports: [ApolloTestingModule] });

  beforeEach(() => (spectator = createService()));

  it('should...', () => {
    expect(spectator.service).toBeTruthy();
  });
});
