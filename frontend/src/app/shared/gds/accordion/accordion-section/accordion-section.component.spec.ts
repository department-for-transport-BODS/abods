import { SpectatorHost, byText, createHostFactory } from '@ngneat/spectator';
import { AccordionSectionComponent } from './accordion-section.component';

describe('AccordionSectionComponent', () => {
  let spectator: SpectatorHost<AccordionSectionComponent>;

  const createHost = createHostFactory({
    component: AccordionSectionComponent,
  });
  const template = '<gds-accordion-section heading="heading 1" summary="summary 1">Content 1</gds-accordion-section>';

  beforeEach(() => {
    spectator = createHost(template);
  });

  it('should expand and collapse section', () => {
    spectator.click(byText('Show'));

    expect(spectator.query(byText('Content 1'))).toBeVisible();
    expect(spectator.query(byText('Show'))).not.toBeVisible();
    expect(spectator.query(byText('Hide'))).toBeVisible();

    spectator.click(byText('Hide'));

    expect(spectator.query(byText('Content 1'))).not.toBeVisible();
    expect(spectator.query(byText('Show'))).toBeVisible();
    expect(spectator.query(byText('Hide'))).not.toBeVisible();
  });
});
