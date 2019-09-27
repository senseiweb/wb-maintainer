import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmServiceProviderConfig } from 'app/core/data-access/em-service-factory/emServiceProviderConfig.service';
import {
  Asset,
  ActionItem,
  AssetTriggerAction,
  GenerationAsset,
  Generation,
  TeamAvailability,
  TeamCategory,
  TeamJobReservation,
  Trigger,
  Team,
  TriggerAction
} from './aagt-data-models';
import { EmServiceProviderFactory } from 'app/core';
import { RepoFactory } from 'app/core/';
import { ActionItemResource } from './aagt-data-models/action-item-resource';
import { HttpClient } from '@angular/common/http';

export function emProviderFactory() {
  const config = new EmServiceProviderConfig();
  config.adapterName = 'spDataService';
  config.serviceEndpoint = 'aagt';
  config.ctxEndpoint = 'aagt';
  config.odataAppEndPoint = 'aagt';
  config.nameSpace = 'SP.Data.Aagt';
  config.featureEntities = [
    Asset,
    ActionItem,
    ActionItemResource,
    AssetTriggerAction,
    GenerationAsset,
    Generation,
    TeamAvailability,
    TeamJobReservation,
    Team,
    Trigger,
    TriggerAction
  ];
  return (emFactory: EmServiceProviderFactory, httpClient: HttpClient) => {
    const mgr = emFactory.createManager(config);
    return new RepoFactory(mgr, httpClient);
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
      deps: [EmServiceProviderFactory, HttpClient]
    }
  ]
})
export class AagtCoreModule {}
