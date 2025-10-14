import { EventEmitter } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import {
  byLabel,
  byText,
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { NgxSmartModalComponent, NgxSmartModalService } from "ngx-smart-modal";
import { SharedModule } from "../../shared/shared.module";
import { OtpThresholdDefaultsService } from "./otp-threshold-defaults.service";
import { OtpThresholdFormComponent } from "./otp-threshold-form.component";

describe("OtpThresholdFormComponent", () => {
  let spectator: Spectator<OtpThresholdFormComponent>;
  let component: OtpThresholdFormComponent;
  let modalService: SpyObject<NgxSmartModalService>;

  const createComponent = createComponentFactory({
    component: OtpThresholdFormComponent,
    imports: [SharedModule, ReactiveFormsModule],
    mocks: [OtpThresholdDefaultsService, NgxSmartModalService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    modalService = spectator.inject(NgxSmartModalService);
    modalService.getModal.and.returnValue({
      onOpen: new EventEmitter<void>(),
    } as unknown as NgxSmartModalComponent);

    spectator.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should show error message when early value is empty and form submitted", () => {
    const input = spectator.query(byLabel("Early"));
    spectator.typeInElement("", input!);
    spectator.click(byText("Compare"));

    spectator.detectChanges();

    expect(
      spectator.query(byText("Please enter a value between 1 and 20 minutes")),
    ).toBeVisible();
  });

  it("should show error message when late value is empty and form submitted", () => {
    const input = spectator.query(byLabel("Late"));
    spectator.typeInElement("", input!);
    spectator.click(byText("Compare"));

    spectator.detectChanges();

    expect(
      spectator.query(byText("Please enter a value between 1 and 20 minutes")),
    ).toBeVisible();
  });

  it("should update early form control on slider value change", async () => {
    component.early = 5;
    spectator.detectChanges();

    await expect(component.form.value.early).toEqual(5);
  });

  it("should update late form control on slider value change", async () => {
    component.late = 5;
    spectator.detectChanges();

    await expect(component.form.value.late).toEqual(5);
  });

  it("should not emit if there is an error", async () => {
    spyOn(component.compare, "emit");
    const input = spectator.query(byLabel("Late"));
    spectator.typeInElement("", input!);
    spectator.click(byText("Compare"));

    spectator.detectChanges();

    await expect(component.compare.emit).not.toHaveBeenCalled();
  });

  it("should emit if there is not an error", () => {
    spyOn(component.compare, "emit");
    const inputEarly = spectator.query(byLabel("Early"));
    const inputLate = spectator.query(byLabel("Late"));

    spectator.typeInElement("5", inputEarly!);
    spectator.typeInElement("15", inputLate!);
    spectator.click(byText("Compare"));

    spectator.detectChanges();

    expect(component.compare.emit).toHaveBeenCalledWith({ late: 15, early: 5 });
  });
});
