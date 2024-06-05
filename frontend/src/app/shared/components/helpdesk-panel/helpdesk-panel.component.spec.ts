import { HelpdeskPanelComponent } from './helpdesk-panel.component';
import { Spectator, SpyObject, byText, createComponentFactory } from '@ngneat/spectator';
import { SharedModule } from '../../shared.module';
import { HelpdeskPanelService } from './helpdesk-panel.service';
import { HelpdeskData, HelpdeskDataService } from '../../services/helpdesk-data.service';
import { of } from 'rxjs';
import { FreshdeskArticle } from '../../services/freshdesk-api.service';

describe('HelpdeskPanelComponent', () => {
  let spectator: Spectator<HelpdeskPanelComponent>;
  let component: HelpdeskPanelComponent;
  let helpdeskDataService: SpyObject<HelpdeskDataService>;
  let helpdeskPanelService: SpyObject<HelpdeskPanelService>;

  const mockData: HelpdeskData = {
    title: 'Test title',
    articles: [
      <FreshdeskArticle>{ title: 'Title 1', description: '<p>Description 1</p>', seo_data: { meta_description: '' } },
      <FreshdeskArticle>{ title: 'Title 2', description: '<p>Description 2</p>', seo_data: { meta_description: '' } },
    ],
  };

  const createComponent = createComponentFactory({
    component: HelpdeskPanelComponent,
    imports: [SharedModule],
    mocks: [HelpdeskPanelService, HelpdeskDataService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    helpdeskDataService = spectator.inject(HelpdeskDataService);
    helpdeskPanelService = spectator.inject(HelpdeskPanelService);
  });

  it('should create component', () => {
    helpdeskDataService.getHelpdeskData.and.returnValue(of(mockData));
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should open the panel', () => {
    helpdeskDataService.getHelpdeskData.and.returnValue(of(mockData));
    spyOnProperty(helpdeskPanelService, 'isOpen').and.returnValue(true);
    spectator.detectChanges();

    expect(component.isOpen).toBeTrue();
  });

  it('should show a message if data is null', () => {
    helpdeskDataService.getHelpdeskData.and.returnValue(of(null));
    spyOnProperty(helpdeskPanelService, 'isOpen').and.returnValue(true);
    spectator.detectChanges();

    expect(spectator.query(byText('Sorry, there are no help articles for this section'))).toBeVisible();
  });

  it('should show title', () => {
    helpdeskDataService.getHelpdeskData.and.returnValue(of(mockData));
    spyOnProperty(helpdeskPanelService, 'isOpen').and.returnValue(true);
    spectator.detectChanges();

    expect(spectator.query(byText('Test title'))).toBeVisible();
  });

  it('should show article titles', () => {
    helpdeskDataService.getHelpdeskData.and.returnValue(of(mockData));
    spyOnProperty(helpdeskPanelService, 'isOpen').and.returnValue(true);
    spectator.detectChanges();

    expect(spectator.query(byText('Title 1'))).toBeVisible();
    expect(spectator.query(byText('Title 2'))).toBeVisible();
  });

  it('should close panel', () => {
    helpdeskDataService.getHelpdeskData.and.returnValue(of(mockData));
    spyOnProperty(helpdeskPanelService, 'isOpen').and.returnValue(true);
    spectator.detectChanges();

    spectator.click(byText('Close'));

    expect(helpdeskPanelService.close).toHaveBeenCalledWith();
  });
});
