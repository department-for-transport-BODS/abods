import { AccordionSectionComponent } from './accordion-section/accordion-section.component';
import { AccordionComponent } from './accordion.component';
import { SpectatorHost, byText, createHostFactory } from '@ngneat/spectator';

describe('AccordionComponent', () => {
  let spectator: SpectatorHost<AccordionComponent>;

  const createHost = createHostFactory({
    component: AccordionComponent,
    declarations: [AccordionSectionComponent],
  });
  const template = `
    <gds-accordion>
      <gds-accordion-section heading="heading 1" summary="summary 1">Content 1</gds-accordion-section>
      <gds-accordion-section heading="heading 2" summary="summary 2">Content 2</gds-accordion-section>
    </gds-accordion>
  `;

  beforeEach(() => {
    spectator = createHost(template);
  });

  it('should expand and collapse all sections', () => {
    spectator.click(byText('Show all sections'));

    expect(spectator.query(byText('Content 1'))).toBeVisible();
    expect(spectator.query(byText('Content 2'))).toBeVisible();
    expect(spectator.query(byText('Show all sections'))).not.toBeVisible();
    expect(spectator.query(byText('Hide all sections'))).toBeVisible();

    spectator.click(byText('Hide all sections'));

    expect(spectator.query(byText('Content 1'))).not.toBeVisible();
    expect(spectator.query(byText('Content 2'))).not.toBeVisible();
    expect(spectator.query(byText('Show all sections'))).toBeVisible();
    expect(spectator.query(byText('Hide all sections'))).not.toBeVisible();
  });
});
