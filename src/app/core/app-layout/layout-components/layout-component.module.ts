import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';

import { ChatPanelComponent } from './chat-panel/chat-panel.component';
import { ContentHolderComponent } from './content-holder/content-holder.component';
import { LayoutFooterComponent } from './layout-footer/layout-footer.component';

import { LayoutNavbarHorizontalStyle1Component } from './layout-navbar/layout-navbar-horizontal/horizontal-style-1/horizontal-style-1.component';
import { LayoutNavbarVerticalStyle1Component } from './layout-navbar/layout-navbar-vertical/vertical-style-1/vertical-style-1.component';
import { LayoutNavbarVerticalStyle2Component } from './layout-navbar/layout-navbar-vertical/vertical-style-2/vertical-style-2.component';
import { LayoutToolbarComponent } from './layout-toolbar/layout-toolbar.component';
import { QuickPanelComponent } from './quick-panel/quick-panel.component';
import { SharedModule } from 'app/shared/shared.module';
import {
  FuseNavigationModule,
  FuseShortcutsModule,
  FuseSearchBarModule
} from '@fuse/components';
import { NavbarComponent } from './layout-navbar/layout-navbar.component';
import { GanttAllModule } from '@syncfusion/ej2-angular-gantt';

@NgModule({
  declarations: [
    ChatPanelComponent,
    ContentHolderComponent,
    NavbarComponent,
    LayoutFooterComponent,
    LayoutNavbarHorizontalStyle1Component,
    LayoutNavbarVerticalStyle1Component,
    LayoutNavbarVerticalStyle2Component,
    LayoutToolbarComponent,
    QuickPanelComponent
  ],
  imports: [
    RouterModule,
    SharedModule,
    FuseNavigationModule,
    FuseShortcutsModule,
    FuseSearchBarModule,
    GanttAllModule
  ],
  exports: [
    ContentHolderComponent,
    ChatPanelComponent,
    NavbarComponent,
    LayoutFooterComponent,
    LayoutNavbarHorizontalStyle1Component,
    LayoutNavbarVerticalStyle1Component,
    LayoutNavbarVerticalStyle2Component,
    LayoutToolbarComponent,
    QuickPanelComponent,
    FuseSearchBarModule
  ]
})
export class LayoutComponentsModule {}
