import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EmServiceProviderFactory,
  EmServiceProviderConfig,
  RepoFactory
} from 'app/core';

export function emProviderFactory() {
  const config = new EmServiceProviderConfig();
  config.adapterName = 'spDataService';
  config.serviceEndpoint = '';
  config.nameSpace = 'SP.Data.Home';
  // Home module is the top level module that will load global data modules.
  return (emFactory: EmServiceProviderFactory) => {
    const mgr = emFactory.createManager(config);
    return new RepoFactory(mgr);
  };
}

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [],
  providers: [
    {
      provide: RepoFactory,
      useFactory: emProviderFactory(),
      deps: [EmServiceProviderFactory]
    }
  ]
})
export class HomeCoreModule {}
