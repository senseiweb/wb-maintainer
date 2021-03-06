import { AagtRoutingModule, routedComponents } from './aagt-routing.module';
import { AagtCoreModule } from './aagt-core';
import { SharedModule } from 'app/shared/shared.module';
import { NgModule } from '@angular/core';
import { ActionItemDetailDialogComponent } from './action-item-manager';
import { FuseMaterialColorPickerModule } from '@fuse/components';
import { MatDialogModule } from '@angular/material';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';

@NgModule({
  imports: [
    AagtRoutingModule,
    AagtCoreModule,
    SharedModule,
    FuseMaterialColorPickerModule,
    MatDialogModule,
    GridAllModule
  ],
  declarations: routedComponents,
  entryComponents: [ActionItemDetailDialogComponent],
  providers: []
})
export class AagtModule {}
