import { NgModule } from '@angular/core';
import { GanttAllModule } from '@syncfusion/ej2-angular-gantt';
import { DateTimePickerAllModule } from '@syncfusion/ej2-angular-calendars';

@NgModule({
  declarations: [],
  imports: [GanttAllModule, DateTimePickerAllModule],
  exports: [GanttAllModule, DateTimePickerAllModule],
  providers: []
})
export class SyncFusionModule {}
