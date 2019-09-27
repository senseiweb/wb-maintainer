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
  private site = `${SpConfig.cfgWebApplicationSite}/mx-maintainer/`;
  private serviceEnd: string;
  private ctxEnd: string;
  private odataAppEnd: string;

  get odataAppEndPoint(): string {
    return this.odataAppEnd;
  }

  set odataAppEndPoint(apiName: string) {
    this.odataAppEnd = (this.site + `${apiName}/_api/$batch`).replace(
      'mx-maintainer//',
      'mx-maintainer/'
    );
  }

  get ctxEndpoint(): string {
    return this.ctxEnd;
  }

  set ctxEndpoint(apiName: string) {
    this.ctxEnd = (this.site + `${apiName}/_api/contextinfo`).replace(
      'mx-maintainer//',
      'mx-maintainer/'
    );
  }

  get serviceEndpoint(): string {
    return this.serviceEnd;
  }

  set serviceEndpoint(apiName: string) {
    this.serviceEnd = (this.site + `${apiName}/_api/`).replace(
      'mx-maintainer//',
      'mx-maintainer/'
    );
  }
}
