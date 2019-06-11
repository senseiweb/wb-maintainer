import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { AppInitializerService } from './core';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

const initApp = (
  appInitializer: AppInitializerService,
  fuseNavSevice: FuseNavigationService
) => () => appInitializer.initNav(fuseNavSevice);

@NgModule({
  declarations: [AppComponent],
  imports: [CoreModule, BrowserModule, AppRoutingModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
      deps: [AppInitializerService, FuseNavigationService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
