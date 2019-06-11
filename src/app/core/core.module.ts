import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AppLayoutModule } from './app-layout/app-layout.module';
import { SharedModule } from 'app/shared/shared.module';
import { FuseModule } from '@fuse/fuse.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { HttpClientModule } from '@angular/common/http';
import { defaultFuseConfig } from './config/fuse-config';
import 'hammerjs';
import {
  FuseProgressBarModule,
  FuseSidebarModule,
  FuseNavigationModule
} from '@fuse/components';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatMomentDateModule,
    AppLayoutModule,
    SharedModule,
    TranslateModule.forRoot(),
    FuseModule.forRoot(defaultFuseConfig),
    FuseProgressBarModule,
    FuseNavigationModule,
    FuseSidebarModule
  ],
  exports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppLayoutModule,
    SharedModule,
    // Material moment date module
    MatMomentDateModule,

    FuseProgressBarModule,
    FuseSidebarModule
  ],
  providers: []
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() core: CoreModule) {
    if (core) {
      throw new Error(
        'Core Module is injected only once into the main app module'
      );
    }
  }
}
