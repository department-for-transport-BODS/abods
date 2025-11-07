import { AgGridAngular, AgGridModule } from "ag-grid-angular";
import { AgGridDomService } from "./ag-grid-dom.service";
import { ColDef } from "ag-grid-community";
import { Subject } from "rxjs";
import { ServicePerformanceType } from "../../../../generated/graphql";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("AgGridDomService", () => {
  let service: AgGridDomService;
  const ready$ = new Subject<void>();

  const data: ServicePerformanceType[] = [
    {
      lineId: "M5P",
      lineInfo: {
        serviceId: "6",
        serviceName: "Dispear to Wear",
        serviceNumber: "1A",
      },
      scheduledDepartures: 123,
      actualDepartures: 115,
      onTime: 80,
      early: 15,
      late: 20,
      averageDelay: 12,
    },
    {
      lineId: "TH",
      lineInfo: {
        serviceId: "7",
        serviceName: "Roade to Nowerre",
        serviceNumber: "2A",
      },
      scheduledDepartures: 321,
      actualDepartures: 311,
      onTime: 300,
      early: 5,
      late: 6,
      averageDelay: 35,
    },
  ];

  const cols: ColDef[] = [
    { field: "lineId" },
    { field: "scheduledDepartures" },
    { field: "actualDepartures" },
  ];

  let fixture: ComponentFixture<AgGridAngular>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgGridModule],
      providers: [AgGridDomService],
    }).compileComponents();

    fixture = TestBed.createComponent(AgGridAngular);
    fixture.componentInstance.rowData = data;
    fixture.componentInstance.columnDefs = cols;
    fixture.componentInstance.domLayout = "autoHeight";
    fixture.componentInstance.gridReady.subscribe((event: any) => {
      ready$.next(event);
    });
    service = TestBed.inject(AgGridDomService);
    fixture.detectChanges();
  });

  it("should get the viewport height", () => {
    fixture.detectChanges();
    const viewport = fixture.nativeElement.querySelector(".ag-body-viewport");
    expect(viewport).toBeTruthy();
    const actual = service.viewportHeight();
    expect(actual).toEqual(viewport?.clientHeight);
  });
});
