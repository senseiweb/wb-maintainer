import { NgModule } from '@angular/core';
import {
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatListModule,
  MatTooltipModule,
  MatTextareaAutosize,
  MatInputModule,
  MatMenuModule,
  MatSlideToggleModule
} from '@angular/material';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseWidgetModule, FuseSidebarModule } from '@fuse/components';

@NgModule({
  declarations: [],
  imports: [
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    FuseSharedModule,
    FuseWidgetModule,
    FuseSidebarModule,
    MatListModule,
    MatTooltipModule,
    MatInputModule,
    MatSlideToggleModule
  ],
  exports: [
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    FuseSharedModule,
    FuseWidgetModule,
    FuseSidebarModule,
    MatSlideToggleModule
  ],
  providers: []
})
export class MaterialModule {}
