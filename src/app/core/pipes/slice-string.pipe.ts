import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "sliceString",
  standalone: true,
})
export class SliceStringPipe implements PipeTransform {
  transform(value: string, size: number): string {
    if (value.length <= size) return value;
    return value.slice(0, size) + "...";
  }
}
