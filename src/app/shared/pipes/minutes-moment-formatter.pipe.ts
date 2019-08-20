import { Pipe, PipeTransform } from '@angular/core';
import * as _m from 'moment';
import 'moment-duration-format';

@Pipe({ name: 'minFormat' })
export class MinutesMomentFormatter implements PipeTransform {
  transform(value: string, args: any[] = []): string {
    if (!value) {
      return;
    }
    if (isNaN(+value)) {
      return value;
    }
    const m = _m.duration(+value, 'minutes') as any;
    return m.format('d [days], h [hours], m [minutes]');
  }
}
