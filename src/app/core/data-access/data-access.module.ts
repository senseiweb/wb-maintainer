import { ModelLibraryBackingStoreAdapter } from 'breeze-client/adapter-model-library-backing-store';
import { UriBuilderODataAdapter } from 'breeze-client/adapter-uri-builder-odata';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { config } from 'breeze-client';
import { AjaxHttpClientAdapter } from './breeze-providers/breeze-angular-bridge';
import { SpDataService } from './breeze-providers/sharepoint-dataservice';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [],
  providers: []
})
export class DataAccessModule {
  constructor(http: HttpClient) {
    ModelLibraryBackingStoreAdapter.register();
    UriBuilderODataAdapter.register();
    AjaxHttpClientAdapter.register();
    SpDataService.register();

    config.initializeAdapterInstance(
      'ajax',
      AjaxHttpClientAdapter.adapterName,
      true
    );
    config.initializeAdapterInstance('dataService', SpDataService.name, true);

    const adapter = config.getAdapterInstance('ajax', 'angular');
    // @ts-ignore
    adapter.initialize(http);
  }
}
