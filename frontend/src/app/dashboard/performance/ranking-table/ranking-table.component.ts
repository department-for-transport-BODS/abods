import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Period } from 'src/app/shared/components/date-range/date-range.types';
import { WindowDatetimes } from 'src/app/shared/services/date-range.service';
import { RankingOrder, ServicePunctualityType } from 'src/generated/graphql';

class ServiceViewModel {
  name: string;
  route: string[];
  onTime: number;
  onTimePct: string;
  nocCode: string;
  showTrend = false;
  onTimeLast?: number;
  trend?: 'decrease' | 'increase';
  trendPctDiff?: string;

  constructor({
    onTime,
    early,
    late,
    lineId,
    lineInfo: { serviceName, serviceNumber },
    nocCode,
    trend,
  }: ServicePunctualityType) {
    const total = (onTime ?? 0) + (early ?? 0) + (late ?? 0);
    this.nocCode = nocCode as string;
    this.name = `${serviceNumber}: ${serviceName}`;
    this.route = ['/on-time/', nocCode as string, lineId];
    this.onTime = total > 0 ? (onTime ?? 0) / total : 0;
    this.onTimePct = `${(this.onTime * 100).toFixed(2)}%`;

    if (trend) {
      this.showTrend = true;
      const { onTime: onTimeLast, early: earlyLast, late: lateLast } = trend;
      const totalLast = (onTimeLast ?? 0) + (earlyLast ?? 0) + (lateLast ?? 0);
      this.onTimeLast = totalLast > 0 ? (onTimeLast ?? 0) / totalLast : 0;

      const diff = this.onTime - this.onTimeLast;
      this.trendPctDiff = diff.toFixed(2);
      if (diff <= 0) {
        this.trend = 'decrease';
      } else {
        this.trend = 'increase';
      }
    }
  }
}
@Component({
  selector: 'app-performance-ranking',
  templateUrl: './ranking-table.component.html',
  styleUrls: ['./ranking-table.component.scss'],
})
export class PerformanceRankingComponent implements OnInit, OnChanges {
  @Input() services?: ServicePunctualityType[];
  @Input() loaded = false;

  @Input() nocCode: string | null = null;
  @Input() operators?: { nocCode?: string | null; name?: string | null }[] | null;

  @Input() fromTo: WindowDatetimes | null = null;
  @Input() period?: Period;

  @Output() orderChanged = new EventEmitter<RankingOrder>();

  rows: ServiceViewModel[] = [];
  RankingOrder = RankingOrder;

  updateRows(services: ServicePunctualityType[]) {
    this.rows = services.map((service) => new ServiceViewModel(service));
  }

  ngOnInit(): void {
    if (this.services) {
      this.updateRows(this.services);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.services) {
      const services = changes.services.currentValue as ServicePunctualityType[];
      this.updateRows(services);
    }
  }

  changeOrder(order: RankingOrder) {
    this.orderChanged.emit(order);
  }

  operatorName(nocCode: string) {
    return this.operators?.find((operator) => operator.nocCode === nocCode)?.name;
  }

  get changeTooltip() {
    let previousPeriodDescription = '';
    switch (this.period) {
      case Period.Last7:
        previousPeriodDescription = 'previous 7 days';
        break;
      case Period.Last28:
        previousPeriodDescription = 'previous 28 days';
        break;
      case Period.LastMonth:
        previousPeriodDescription = 'previous month';
        break;
      case Period.MonthToDate:
        previousPeriodDescription = 'equivalent period last month';
        break;
    }

    let previousDateStr = '';
    if (this.fromTo) {
      const { trendFrom, trendTo } = this.fromTo;
      previousDateStr = ` (${trendFrom.toFormat('d MMMM')} - ${trendTo.toFormat('d MMMM')})`;
    }
    return `Change in on-time percentage from ${previousPeriodDescription}${previousDateStr}`;
  }
}
