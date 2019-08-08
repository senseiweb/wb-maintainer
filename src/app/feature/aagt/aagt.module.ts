import { AagtRoutingModule, routedComponents } from './aagt-routing.module';
import { AagtCoreModule } from './aagt-core';
import { SharedModule } from 'app/shared/shared.module';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [AagtRoutingModule, AagtCoreModule, SharedModule],
  declarations: routedComponents,
  providers: []
})
export class AagtModule {}
