import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { LayoutComponentsModule } from './layout-components/layout-component.module';
import { HorizontalLayout1Component } from './app-layout-horizontal/app-hlayout-1/app-hlayout-1.component';
import { VerticalLayout1Component } from './app-layout-vertical/app-vlayout-1/app-vlayout-1.component';
import { VerticalLayout2Component } from './app-layout-vertical/app-vlayout-2/app-vlayout-2.component';
import { VerticalLayout3Component } from './app-layout-vertical/app-vlayout-3/app-vlayout-3.component';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
  declarations: [
    HorizontalLayout1Component,
    VerticalLayout1Component,
    VerticalLayout2Component,
    VerticalLayout3Component
  ],
  imports: [
    SharedModule,
    RouterModule,
    FuseSharedModule,
    LayoutComponentsModule
  ],
  exports: [
    FuseSharedModule,
    HorizontalLayout1Component,
    VerticalLayout1Component,
    VerticalLayout2Component,
    VerticalLayout3Component
  ]
})
export class AppLayoutModule {}
