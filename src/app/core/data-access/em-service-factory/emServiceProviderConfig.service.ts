import { Injectable } from '@angular/core';
import { DataAccessModule } from '../data-access.module';
import { BreezeEntity } from '../../data-models';
import { SpConfig } from '../../config/app-config';
import { MetadataStore } from 'breeze-client';

@Injectable({ providedIn: DataAccessModule })
export class EmServiceProviderConfig {
  featureEntities: typeof BreezeEntity[] = [];
  adapterName: 'spDataService';
  nameSpace: 'SP.Data.Aagt' | 'SP.Data.Home' | 'Global';

  private serviceEnd: string;

  get serviceEndpoint(): string {
    return this.serviceEnd;
  }

  set serviceEndpoint(apiName: string) {
    const site = `${
      SpConfig.cfgWebApplicationSite
    }/mx-maintainer/${apiName}/_api/`;
    this.serviceEnd = site.replace('mx-maintainer//', 'mx-maintainer/');
  }
}
