import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';
import { FuseSharedModule } from '@fuse/shared.module';

@NgModule({
  declarations: [],
  imports: [FuseSharedModule, MaterialModule],
  exports: [FuseSharedModule, MaterialModule],
  providers: []
})
export class SharedModule {}
