import { Pipe, PipeTransform } from "@angular/core";
import { nonNullishArray, NullishArray } from "../array-operators";

@Pipe({
  name: "join",
  standalone: false,
})
export class JoinPipe implements PipeTransform {
  transform(
    elements?: NullishArray<string>,
    separator = ", ",
  ): string | undefined {
    return nonNullishArray(elements).join(separator);
  }
}
