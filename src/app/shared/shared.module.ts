import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { SyncFusionModule } from './syncfusion.module';
import { PipesModule } from './pipes/pipes.module';
@NgModule({
  declarations: [],
  imports: [PipesModule, FuseSharedModule, MaterialModule, SyncFusionModule],
  exports: [PipesModule, FuseSharedModule, MaterialModule, SyncFusionModule],
  providers: []
})
export class SharedModule {}
