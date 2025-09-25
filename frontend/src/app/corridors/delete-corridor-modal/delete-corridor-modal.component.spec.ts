import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonComponent } from "../../shared/gds/button/button.component";

import { provideHttpClient } from "@angular/common/http";
import { NgxSmartModalModule, NgxSmartModalService } from "ngx-smart-modal";
import { ModalComponent } from "../../shared/components/modal/modal.component";
import { SharedModule } from "../../shared/shared.module";
import { Corridor } from "../types";
import { DeleteCorridorModalComponent } from "./delete-corridor-modal.component";

fdescribe("DeleteCorridorModalComponent", () => {
  let component: DeleteCorridorModalComponent;
  let fixture: ComponentFixture<DeleteCorridorModalComponent>;
  let modalService: NgxSmartModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        DeleteCorridorModalComponent,
        ButtonComponent,
        ModalComponent,
      ],
      imports: [NgxSmartModalModule.forRoot(), SharedModule],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteCorridorModalComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgxSmartModalService);
    component.corridor = {
      name: "Test Corridor",
    } as Corridor;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should show corridor name in message", async () => {
    modalService.open("deleteCorridor");
    fixture.detectChanges();

    const el = (
      fixture.debugElement.nativeElement as HTMLElement
    ).querySelector(".govuk-body");

    await expect(el?.innerHTML).toContain("Test Corridor");
  });

  it("should emit deleteCorridor when delete button clicked", () => {
    modalService.open("deleteCorridor");
    fixture.detectChanges();

    spyOn(component.deleteCorridor, "emit");
    const button = (
      fixture.debugElement.nativeElement as HTMLElement
    ).querySelector<HTMLElement>(".govuk-button--warning")!;

    button.click();

    expect(component.deleteCorridor.emit).toHaveBeenCalledWith(
      component.corridor,
    );
  });
});
