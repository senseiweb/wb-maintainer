import { NgModule } from '@angular/core';
import {
  MatToolbarModule,
  MatStepperModule,
  MatIconModule,
  MatButtonModule,
  MatListModule,
  MatTooltipModule,
  MatTableModule,
  MatSelectModule,
  MatInputModule,
  MatMenuModule,
  MatTabsModule,
  MatSlideToggleModule,
  MatPaginatorModule,
  MatSortModule,
  MatSnackBarModule,
  MatProgressBarModule
} from '@angular/material';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseWidgetModule, FuseSidebarModule } from '@fuse/components';

@NgModule({
  declarations: [],
  imports: [
    MatSortModule,
    MatTabsModule,
    MatToolbarModule,
    MatTableModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    FuseSharedModule,
    FuseWidgetModule,
    FuseSidebarModule,
    MatListModule,
    MatTooltipModule,
    MatInputModule,
    MatStepperModule,
    MatSlideToggleModule,
    DragDropModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  exports: [
    MatSortModule,
    MatTabsModule,
    MatToolbarModule,
    MatTableModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    FuseSharedModule,
    FuseWidgetModule,
    FuseSidebarModule,
    MatSlideToggleModule,
    MatStepperModule,
    DragDropModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  providers: []
})
export class MaterialModule {}
