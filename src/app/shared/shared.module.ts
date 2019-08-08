import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { SyncFusionModule } from './syncfusion.module';
@NgModule({
  declarations: [],
  imports: [FuseSharedModule, MaterialModule, SyncFusionModule],
  exports: [FuseSharedModule, MaterialModule, SyncFusionModule],
  providers: []
})
export class SharedModule {}
