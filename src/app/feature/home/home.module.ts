import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { routedComponents, HomeRoutingModule } from './home-routing.module';
import { HomeCoreModule } from './home-core/home-core.module';
import { GanttAllModule } from '@syncfusion/ej2-angular-gantt';

@NgModule({
  declarations: routedComponents,
  imports: [HomeRoutingModule, SharedModule, HomeCoreModule, GanttAllModule],
  exports: [],
  providers: []
})
export class HomeModule {}
