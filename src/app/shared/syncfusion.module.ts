import { NgModule } from '@angular/core';
import { GanttAllModule } from '@syncfusion/ej2-angular-gantt';
import { DateTimePickerAllModule } from '@syncfusion/ej2-angular-calendars';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';

@NgModule({
  declarations: [],
  imports: [GanttAllModule, DateTimePickerAllModule, RichTextEditorAllModule],
  exports: [GanttAllModule, DateTimePickerAllModule, RichTextEditorAllModule],
  providers: []
})
export class SyncFusionModule {}
