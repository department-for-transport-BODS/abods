import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as am4core from '@amcharts/amcharts4/core';

export const chartColors = {
  // GovUK colors
  red: am4core.color('#d4351c'),
  yellow: am4core.color('#ffdd00'),
  ochre: am4core.color('#e5c700'),
  green: am4core.color('#00703c'),
  blue: am4core.color('#1d70b8'),
  darkBlue: am4core.color('#003078'),
  lightBlue: am4core.color('#5694ca'),
  purple: am4core.color('#4c2c92'),
  black: am4core.color('#0b0c0c'),
  darkGrey: am4core.color('#505a5f'),
  midGrey: am4core.color('#b1b4b6'),
  lightGrey: am4core.color('#f3f2f1'),
  white: am4core.color('#ffffff'),
  lightPurple: am4core.color('#6f72af'),
  brightPurple: am4core.color('#912b88'),
  pink: am4core.color('#d53880'),
  lightPink: am4core.color('#f499be'),
  orange: am4core.color('#f47738'),
  brown: am4core.color('#b58840'),
  lightGreen: am4core.color('#85994b'),
  turquoise: am4core.color('#28a197'),
  // Others
  legendaryGrey: am4core.color('#626A6E'),
  brightGreen: am4core.color('#74bb68'),
};

export const loadingSpinner = (container: am4core.Container) => {
  container.background.fill = chartColors.lightGrey;
  container.background.fillOpacity = 0.6;
  container.width = am4core.percent(100);
  container.height = am4core.percent(100);

  const indicatorLabel = container.createChild(am4core.Label);
  indicatorLabel.text = 'Loading...';
  indicatorLabel.align = 'center';
  indicatorLabel.valign = 'middle';
  indicatorLabel.fontSize = 15;
  indicatorLabel.dy = 50;
  indicatorLabel.fill = chartColors.legendaryGrey;

  container = container.createChild(am4core.Container);
  container.padding(5, 5, 5, 5);
  container.align = 'center';
  container.valign = 'middle';
  container.horizontalCenter = 'middle';
  container.verticalCenter = 'middle';
  container.layout = 'horizontal';

  const createDot = (id: string, gap = 0) => {
    const circle = container.createChild(am4core.Circle);
    circle.width = 10;
    circle.height = 10;
    circle.marginLeft = gap;
    circle.fill = chartColors.darkBlue;
    circle.id = id;
    return circle;
  };

  createDot('chart-spinner-dot1');
  createDot('chart-spinner-dot2', 6);
  createDot('chart-spinner-dot3', 6);
};

const exclamationMarkPath =
  'M23.625 12C23.625 18.4217 18.4199 23.625 12 23.625C5.58014 23.625 0.375 18.4217 0.375 12C0.375 5.58202 5.58014 0.375 12 ' +
  '0.375C18.4199 0.375 23.625 5.58202 23.625 12ZM12 14.3438C10.8091 14.3438 9.84375 15.3091 9.84375 16.5C9.84375 17.6909 10.8091 ' +
  '18.6562 12 18.6562C13.1909 18.6562 14.1562 17.6909 14.1562 16.5C14.1562 15.3091 13.1909 14.3438 12 14.3438ZM9.95283 ' +
  '6.59316L10.3005 12.9682C10.3168 13.2665 10.5635 13.5 10.8622 13.5H13.1378C13.4365 13.5 13.6832 13.2665 13.6995 12.9682L14.0472 ' +
  '6.59316C14.0648 6.27094 13.8082 6 13.4855 6H10.5144C10.1917 6 9.93525 6.27094 9.95283 6.59316Z';

export const messageScreen = (screen: am4core.Container, severity: 'error' | 'warn', message: string) => {
  screen.background.fill = chartColors.lightGrey;
  screen.background.fillOpacity = severity === 'error' ? 1 : 0.6;
  screen.width = am4core.percent(100);
  screen.height = am4core.percent(100);

  const indicatorLabel = screen.createChild(am4core.Label);
  indicatorLabel.text = message;
  indicatorLabel.align = 'center';
  indicatorLabel.valign = 'middle';
  indicatorLabel.fontSize = 15;
  indicatorLabel.dy = 50;
  indicatorLabel.fill = severity === 'error' ? chartColors.red : chartColors.legendaryGrey;

  const icon = screen.createChild(am4core.Sprite);
  icon.path = exclamationMarkPath;
  icon.align = 'center';
  icon.valign = 'middle';
  icon.horizontalCenter = 'middle';
  icon.verticalCenter = 'middle';
  icon.fill = severity === 'error' ? chartColors.red : chartColors.orange;
};

am4core.options.autoSetClassName = true; // enables classnames

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  colorMap = chartColors;

  chartColorList = [
    this.colorMap.lightBlue,
    this.colorMap.blue,
    this.colorMap.darkBlue,
    this.colorMap.purple,
    this.colorMap.brightPurple,
    this.colorMap.black,
    this.colorMap.legendaryGrey,
  ];

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(@Inject(PLATFORM_ID) private platformId: object, private zone: NgZone) {}

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  getErrorObject(errorScreen?: am4core.Container) {
    if (errorScreen) {
      messageScreen(errorScreen, 'error', 'There was an error loading the data for this chart, please try again.');
    }
  }

  // TODO none of these need to be scoped this way
  getSpinnerObject(loadingScreen?: am4core.Container) {
    if (loadingScreen) {
      loadingSpinner(loadingScreen);
    }
  }

  getNoDataObject(noDataScreen?: am4core.Container) {
    if (noDataScreen) {
      messageScreen(noDataScreen, 'warn', 'No data exists with the applied filters');
    }
  }

  getFontFamily() {
    return 'GDS Transport';
  }
}
