import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StatusComponent } from "./status.component";
import {
  AngularSvgIconModule,
  SvgIconRegistryService,
  SvgLoader,
} from "angular-svg-icon";
import { of } from "rxjs";

describe("StatusComponent", () => {
  let component: StatusComponent;
  let fixture: ComponentFixture<StatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusComponent],
      imports: [AngularSvgIconModule],
      providers: [
        SvgIconRegistryService,
        { provide: SvgLoader, useValue: { getSvg: () => of("") } }, // simple mock
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
