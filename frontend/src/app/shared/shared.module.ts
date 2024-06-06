import { NgModule } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ActionListModule } from './components/actionlist/actionlist.module';
import { BrowserTitleComponent } from './components/browser-title/browser-title.component';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { NoSanitizePipe } from './pipes/no-sanitize.pipe';
import { StatComponent } from './components/stat/stat.component';
import { PopoverComponent } from './components/popover/popover.component';
import { GdsModule } from './gds/gds.module';
import { TooltipComponent } from './components/tooltip/tooltip.component';
import { BoxComponent } from './components/box/box.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SkeletonComponent } from './components/skeleton/skeleton.component';
import { ModalComponent } from './components/modal/modal.component';
import { StackComponent } from './components/stack/stack.component';
import { OperatorSelectorComponent } from './components/operator-selector/operator-selector.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StatusComponent } from './components/status/status.component';
import { LinkComponent } from './components/link/link.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { TabComponent } from './components/tabs/tab/tab.component';
import { ChangeComponent } from './components/change/change.component';
import { DateRangeControlsComponent } from './components/date-range/date-range-controls.component';
import { DateRangeComponent } from './components/date-range/date-range.component';
import { SegmentedToggleComponent } from './components/segmented-toggle/segmented-toggle.component';
import { SegmentedToggleItemComponent } from './components/segmented-toggle/segmented-toggle-item/segmented-toggle-item.component';
import { PanelComponent } from './components/panel/panel.component';
import { TimeRangeSliderComponent } from './components/time-range-slider/time-range-slider.component';
import { NouisliderModule } from 'ng2-nouislider';
import { RangeSliderComponent } from './components/range-slider/range-slider.component';
import { TrapFocusDirective } from './directives/trap-focus.directive';
import { CalendarComponent } from './components/date-range/calendar.component';
import { LuxonModule } from 'luxon-angular';
import { PagingPanelComponent } from './components/paging-panel/paging-panel.component';
import { NoRowsOverlayComponent } from './components/ag-grid/no-rows-overlay/no-rows-overlay.component';
import { RouterLinkCellRendererComponent } from './components/ag-grid/router-link-cell/router-link-cell.component';
import { NoInfinityPipe } from './pipes/no-infinity.pipe';
import { TabContentDirective } from './components/tabs/tab-content.directive';
import { ButtonCellRendererComponent } from './components/ag-grid/button-cell/button-cell.component';
import { XYChartComponent } from './components/amcharts/xy-chart.component';
import { SelectableTextCellRendererComponent } from './components/ag-grid/selectable-text-cell/selectable-text-cell.component';
import { AgGridDirective } from './components/ag-grid/ag-grid.directive';
import { IconCellRendererComponent } from './components/ag-grid/icon-cell/icon-cell-renderer.component';
import { IconHeaderComponent } from './components/ag-grid/icon-header/icon-header.component';
import { DynamicPanelComponentHostDirective } from './components/panel/dynamic-panel-component-host.directive';
import { WindowVirtualScrollDirective } from './scrolling/window-virtual-scroll.directive';
import { AutoResizeMapDirective } from './directives/auto-resize-map.directive';
import { ChipComponent } from './components/chip/chip.component';
import { EmptyCellComponent } from './components/ag-grid/empty-cell/empty-cell.component';
import { DistancePipe } from './pipes/distance.pipe';
import { LowercaseFormControlDirective } from './directives/form-control/lowercase-form-control.directive';
import { UppercaseFormControlDirective } from './directives/form-control/uppercase-form-control.directive';
import { DateComponent } from './components/date/date.component';
import { OtpLegendComponent } from './components/otp-legend/otp-legend.component';
import { FormatDurationPipe } from './pipes/format-duration.pipe';
import { GeoContextPipe } from './mapbox/geo-context.pipe';
import { JoinPipe } from './pipes/join.pipe';
import { MapRecentreButtonComponent } from './components/map-recentre-button/map-recentre-button.component';
import { MapViewToggleComponent } from './components/map-view-toggle/map-view-toggle.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { InviteUserModalComponent } from './components/invite-user-modal/invite-user-modal.component';
import { OtpParamRangeSliderComponent } from './components/otp-param-range-slider/otp-param-range-slider.component';
import { MaxNumberFormControlDirective } from './directives/form-control/max-number-form-control.directive';
import { MinNumberFormControlDirective } from './directives/form-control/min-number-form-control.directive';
import { WholeNumberFormControlDirective } from './directives/form-control/whole-number-form-control.directive';
import { HelpdeskPanelComponent } from './components/helpdesk-panel/helpdesk-panel.component';
import { MouseupOutsideDirective } from './directives/mouseup-outside.directive';
import { FreshdeskHtmlFormatterPipe } from './components/helpdesk-panel/freshdesk-html-formatter.pipe';
@NgModule({
  declarations: [
    NoInfinityPipe,
    NoSanitizePipe,
    PopoverComponent,
    BrowserTitleComponent,
    StatComponent,
    TooltipComponent,
    BoxComponent,
    SpinnerComponent,
    SkeletonComponent,
    ModalComponent,
    StackComponent,
    OperatorSelectorComponent,
    StatusComponent,
    LinkComponent,
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
    DropdownComponent,
    InviteUserModalComponent,
    OtpParamRangeSliderComponent,
    MaxNumberFormControlDirective,
    MinNumberFormControlDirective,
    WholeNumberFormControlDirective,
    HelpdeskPanelComponent,
    MouseupOutsideDirective,
    FreshdeskHtmlFormatterPipe,
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
    SpinnerComponent,
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
    DropdownComponent,
    InviteUserModalComponent,
    OtpParamRangeSliderComponent,
    MaxNumberFormControlDirective,
    MinNumberFormControlDirective,
    WholeNumberFormControlDirective,
    HelpdeskPanelComponent,
    MouseupOutsideDirective,
  ],
})
export class SharedModule {}
