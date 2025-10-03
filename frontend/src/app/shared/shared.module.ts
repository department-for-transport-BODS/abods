import { CommonModule, PercentPipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NgSelectModule } from "@ng-select/ng-select";
import { AngularSvgIconModule } from "angular-svg-icon";
import { LuxonModule } from "luxon-angular";
import { NouisliderModule } from "ng2-nouislider";
import { NgxSmartModalModule } from "ngx-smart-modal";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { ActionListModule } from "./components/actionlist/actionlist.module";
import { AgGridDirective } from "./components/ag-grid/ag-grid.directive";
import { ButtonCellRendererComponent } from "./components/ag-grid/button-cell/button-cell.component";
import { EmptyCellComponent } from "./components/ag-grid/empty-cell/empty-cell.component";
import { IconCellRendererComponent } from "./components/ag-grid/icon-cell/icon-cell-renderer.component";
import { IconHeaderComponent } from "./components/ag-grid/icon-header/icon-header.component";
import { NoRowsOverlayComponent } from "./components/ag-grid/no-rows-overlay/no-rows-overlay.component";
import { RouterLinkCellRendererComponent } from "./components/ag-grid/router-link-cell/router-link-cell.component";
import { SelectableTextCellRendererComponent } from "./components/ag-grid/selectable-text-cell/selectable-text-cell.component";
import { XYChartComponent } from "./components/amcharts/xy-chart.component";
import { BoxComponent } from "./components/box/box.component";
import { BrowserTitleComponent } from "./components/browser-title/browser-title.component";
import { ChangeComponent } from "./components/change/change.component";
import { ChipComponent } from "./components/chip/chip.component";
import { CalendarComponent } from "./components/date-range/calendar.component";
import { DateRangeControlsComponent } from "./components/date-range/date-range-controls.component";
import { DateRangePickerComponent } from "./components/date-range/date-range-picker.component";
import { DateRangeComponent } from "./components/date-range/date-range.component";
import { DateComponent } from "./components/date/date.component";
import { DayOfWeekSelectComponent } from "./components/day-of-week-select/day-of-week-select.component";
import { DropdownComponent } from "./components/dropdown/dropdown.component";
import { FreshdeskHtmlFormatterPipe } from "./components/helpdesk-panel/freshdesk-html-formatter.pipe";
import { HelpdeskPanelComponent } from "./components/helpdesk-panel/helpdesk-panel.component";
import { LinkComponent } from "./components/link/link.component";
import { LocationSearchComponent } from "./components/location-search/location-search.component";
import { MapRecentreButtonComponent } from "./components/map-recentre-button/map-recentre-button.component";
import { ScheduledRouteToggleComponent } from "./components/map-view-scheduled-route-toggle/map-view-scheduled-route-toggle.component";
import { MapViewToggleComponent } from "./components/map-view-toggle/map-view-toggle.component";
import { ModalComponent } from "./components/modal/modal.component";
import { OperatorSelectorComponent } from "./components/operator-selector/operator-selector.component";
import { OtpLegendComponent } from "./components/otp-legend/otp-legend.component";
import { OtpParamRangeSliderComponent } from "./components/otp-param-range-slider/otp-param-range-slider.component";
import { PagingPanelComponent } from "./components/paging-panel/paging-panel.component";
import { DynamicPanelComponentHostDirective } from "./components/panel/dynamic-panel-component-host.directive";
import { PanelComponent } from "./components/panel/panel.component";
import { PopoverComponent } from "./components/popover/popover.component";
import { RangeSliderComponent } from "./components/range-slider/range-slider.component";
import { MatchTypeSegmentedToggleComponent } from "./components/segmented-toggle/match-type-segmented-toggle.component";
import { SegmentedToggleItemComponent } from "./components/segmented-toggle/segmented-toggle-item/segmented-toggle-item.component";
import { SegmentedToggleComponent } from "./components/segmented-toggle/segmented-toggle.component";
import { StopTypeSegmentedToggleComponent } from "./components/segmented-toggle/stop-type-segmented-toggle.component";
import { SkeletonComponent } from "./components/skeleton/skeleton.component";
import { StackComponent } from "./components/stack/stack.component";
import { StatComponent } from "./components/stat/stat.component";
import { StatTemplateDirective } from "./components/stat/stat.directive";
import { StatusComponent } from "./components/status/status.component";
import { TabContentDirective } from "./components/tabs/tab-content.directive";
import { TabComponent } from "./components/tabs/tab/tab.component";
import { TabsComponent } from "./components/tabs/tabs.component";
import { TimeRangeSliderComponent } from "./components/time-range-slider/time-range-slider.component";
import { TooltipComponent } from "./components/tooltip/tooltip.component";
import { AutoResizeMapDirective } from "./directives/auto-resize-map.directive";
import { LowercaseFormControlDirective } from "./directives/form-control/lowercase-form-control.directive";
import { MaxNumberFormControlDirective } from "./directives/form-control/max-number-form-control.directive";
import { MinNumberFormControlDirective } from "./directives/form-control/min-number-form-control.directive";
import { UppercaseFormControlDirective } from "./directives/form-control/uppercase-form-control.directive";
import { WholeNumberFormControlDirective } from "./directives/form-control/whole-number-form-control.directive";
import { MouseupOutsideDirective } from "./directives/mouseup-outside.directive";
import { TrapFocusDirective } from "./directives/trap-focus.directive";
import { GdsModule } from "./gds/gds.module";
import { GeoContextPipe } from "./mapbox/geo-context.pipe";
import { DistancePipe } from "./pipes/distance.pipe";
import { FormatDurationPipe } from "./pipes/format-duration.pipe";
import { JoinPipe } from "./pipes/join.pipe";
import { NoInfinityPipe } from "./pipes/no-infinity.pipe";
import { NoSanitizePipe } from "./pipes/no-sanitize.pipe";
import { WindowVirtualScrollDirective } from "./scrolling/window-virtual-scroll.directive";

@NgModule({
  declarations: [
    NoInfinityPipe,
    NoSanitizePipe,
    PopoverComponent,
    BrowserTitleComponent,
    StatComponent,
    TooltipComponent,
    BoxComponent,
    SkeletonComponent,
    ModalComponent,
    StackComponent,
    OperatorSelectorComponent,
    StatusComponent,
    LinkComponent,
    MatchTypeSegmentedToggleComponent,
    StopTypeSegmentedToggleComponent,
    SegmentedToggleComponent,
    SegmentedToggleItemComponent,
    TabsComponent,
    TabComponent,
    TabContentDirective,
    ChangeComponent,
    DateRangeControlsComponent,
    DateRangeComponent,
    DateComponent,
    PanelComponent,
    TimeRangeSliderComponent,
    RangeSliderComponent,
    TrapFocusDirective,
    CalendarComponent,
    PagingPanelComponent,
    NoRowsOverlayComponent,
    RouterLinkCellRendererComponent,
    SelectableTextCellRendererComponent,
    ButtonCellRendererComponent,
    IconCellRendererComponent,
    IconHeaderComponent,
    XYChartComponent,
    AgGridDirective,
    DynamicPanelComponentHostDirective,
    WindowVirtualScrollDirective,
    AutoResizeMapDirective,
    ChipComponent,
    EmptyCellComponent,
    DistancePipe,
    LowercaseFormControlDirective,
    UppercaseFormControlDirective,
    OtpLegendComponent,
    FormatDurationPipe,
    GeoContextPipe,
    JoinPipe,
    MapRecentreButtonComponent,
    MapViewToggleComponent,
    ScheduledRouteToggleComponent,
    DropdownComponent,
    OtpParamRangeSliderComponent,
    MaxNumberFormControlDirective,
    MinNumberFormControlDirective,
    WholeNumberFormControlDirective,
    HelpdeskPanelComponent,
    MouseupOutsideDirective,
    FreshdeskHtmlFormatterPipe,
    LocationSearchComponent,
    DayOfWeekSelectComponent,
    DateRangePickerComponent,
    StatTemplateDirective,
  ],
  providers: [PercentPipe],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AngularSvgIconModule.forRoot(),
    NgxTippyModule,
    ActionListModule,
    GdsModule,
    NgxSmartModalModule.forChild(),
    NgSelectModule,
    NouisliderModule,
    LuxonModule,
    ReactiveFormsModule,
  ],
  exports: [
    PopoverComponent,
    TooltipComponent,
    AngularSvgIconModule,
    // shared components
    ActionListModule,
    BoxComponent,
    StatComponent,
    NoInfinityPipe,
    NoSanitizePipe,
    BrowserTitleComponent,
    SkeletonComponent,
    GdsModule,
    ModalComponent,
    StackComponent,
    OperatorSelectorComponent,
    StatusComponent,
    LinkComponent,
    TabsComponent,
    TabComponent,
    TabContentDirective,
    ChangeComponent,
    DateRangeComponent,
    DateComponent,
    MatchTypeSegmentedToggleComponent,
    StopTypeSegmentedToggleComponent,
    SegmentedToggleComponent,
    SegmentedToggleItemComponent,
    PanelComponent,
    TimeRangeSliderComponent,
    PagingPanelComponent,
    NoRowsOverlayComponent,
    RouterLinkCellRendererComponent,
    SelectableTextCellRendererComponent,
    ButtonCellRendererComponent,
    IconCellRendererComponent,
    IconHeaderComponent,
    XYChartComponent,
    AgGridDirective,
    WindowVirtualScrollDirective,
    AutoResizeMapDirective,
    ChipComponent,
    DistancePipe,
    LowercaseFormControlDirective,
    UppercaseFormControlDirective,
    OtpLegendComponent,
    FormatDurationPipe,
    GeoContextPipe,
    JoinPipe,
    MapRecentreButtonComponent,
    MapViewToggleComponent,
    ScheduledRouteToggleComponent,
    DropdownComponent,
    OtpParamRangeSliderComponent,
    MaxNumberFormControlDirective,
    MinNumberFormControlDirective,
    WholeNumberFormControlDirective,
    HelpdeskPanelComponent,
    MouseupOutsideDirective,
    LocationSearchComponent,
    DayOfWeekSelectComponent,
    DateRangePickerComponent,
    StatTemplateDirective,
  ],
})
export class SharedModule {}
