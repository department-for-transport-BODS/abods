import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { FeatureCollection, Point } from 'geojson';
import { SharedModule } from '../../../shared/shared.module';
import { Stop } from '../../corridors.service';

import { LIST_LEN, StopSearchListComponent } from './stop-search-list.component';

const stopListFactory = (numberOfStops: number) => {
  const stops: FeatureCollection<Point, Stop> = {
    type: 'FeatureCollection',
    features: [],
  };
  for (let i = 0; i < numberOfStops; i++) {
    stops.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [53.381, -1.465],
      },
      properties: {
        stopId: 'ID_' + i,
        stopName: 'STOP_' + i,
        lon: -1.465,
        lat: 53.381,
        naptan: 'NAP_' + i,
        localityName: 'LOC_' + i,
        intId: i,
      },
    });
  }
  return stops;
};

describe('StopSearchListComponent', () => {
  let spectator: Spectator<StopSearchListComponent>;
  let stops: FeatureCollection<Point, Stop>;
  const numberOfStops = 220;

  const createComponent = createComponentFactory({
    imports: [SharedModule],
    component: StopSearchListComponent,
    detectChanges: true,
  });

  beforeEach(() => {
    spectator = createComponent();
    stops = stopListFactory(numberOfStops);
    spectator.component.matchingStops = stops;
    spectator.detectChanges();
  });

  it('should initially show first 100 stops only', () => {
    for (let i = 0; i < LIST_LEN; i++) {
      expect(spectator.query(byText('STOP_' + i))).toBeVisible();
    }

    expect(spectator.query(byText('STOP_100'))).not.toBeVisible();
  });

  it('should show first 200 stops after Show more button is clicked', () => {
    spectator.click(byText('Show more'));

    for (let i = 0; i < LIST_LEN + LIST_LEN; i++) {
      expect(spectator.query(byText('STOP_' + i))).toBeVisible();
    }

    expect(spectator.query(byText('STOP_200'))).not.toBeVisible();
  });

  it('should show all stops and hide Show more button after Show more button is clicked twice', () => {
    spectator.click(byText('Show more'));
    spectator.click(byText('Show more'));

    for (let i = 0; i < numberOfStops; i++) {
      expect(spectator.query(byText('STOP_' + i))).toBeVisible();
    }

    expect(spectator.query(byText('STOP_220'))).not.toBeVisible();
    expect(spectator.query(byText('Show more'))).not.toBeVisible();
  });
});
