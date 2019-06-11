import { Injectable } from '@angular/core';
import { CoreModule } from '../core.module';

@Injectable({ providedIn: CoreModule })
export class ScriptLoaderService {
  private scriptLoaded: { [index: string]: boolean } = {};
  private scriptLoading: { [index: string]: Promise<any> } = {};

  constructor() {}

  async loadGoogleChart(chartType: string): Promise<void> {
    if (this.scriptLoaded[chartType]) {
      return Promise.resolve();
    }

    await this.loadGoogleChartLoader();
    this.scriptLoaded[chartType] = true;

    return new Promise((resolve, reject) => {
      // google.charts.load('current', { packages: [chartType] });
      // google.charts.setOnLoadCallback(resolve);
    });
  }

  private loadGoogleChartLoader(): Promise<void> {
    return this.loadScript(
      'googleChart',
      'https://www.gstatic.com/charts/loader.js'
    );
  }

  loadScript(scriptKey: string, scriptAddress: string): Promise<any> {
    if (this.scriptLoaded[scriptKey]) {
      return Promise.resolve();
    }

    if (this.scriptLoading[scriptKey]) {
      return this.scriptLoading[scriptKey];
    }

    const scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptAddress;
      script.async = true;
      script.defer = true;
      script.onload = (): void => {
        this.scriptLoading[scriptKey] = undefined;
        this.scriptLoaded[scriptKey] = true;
        resolve();
      };
      script.onerror = (): void => {
        this.scriptLoading[scriptKey] = undefined;
        reject();
      };
      document.getElementsByTagName('head')[0].appendChild(script);
    });

    this.scriptLoading[scriptKey] = scriptPromise;
    return scriptPromise;
  }
}
