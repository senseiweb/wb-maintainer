import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { HomeCoreModule } from '../home-core';

@Injectable({ providedIn: HomeCoreModule })
export class LandingBageResolverService implements Resolve<any> {
  constructor() {
    debugger;
  }

  resolve(route: ActivatedRouteSnapshot): Promise<any> {
    const id = route.params.id;

    return undefined;
  }
}
