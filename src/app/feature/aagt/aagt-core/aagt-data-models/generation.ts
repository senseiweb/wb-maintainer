import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';
import * as _l from 'lodash';
import { AssetTriggerAction } from './asset-trigger-action';
import { GenerationAsset } from './generation-asset';
import { TeamJobReservation } from './team-job-reservation';
import { Trigger } from './trigger';
import { GenGraphData, TrigGrapData, AssetTrigActGraph } from '@app_types';
import { trigger } from '@angular/animations';

export enum GenStatusEnum {
  Draft = 'Draft',
  Planned = 'Planned',
  Active = 'Active',
  Historical = 'Historical'
}

@BzEntity()
export class Generation extends SharepointEntity {
  readonly shortname = 'generation';

  @BzEntityProp('data', { dataCfg: { isNullable: false } })
  title: string;

  // @BzEntityProp('data')
  // isActive: boolean;

  @BzEntityProp('data')
  iso: string;

  @BzEntityProp('data')
  genStatus: GenStatusEnum;

  @BzEntityProp('data')
  assignedAssetCount: number;

  @BzEntityProp('data')
  genStartDate: Date;

  @BzEntityProp('data')
  genEndDate: Date;

  // assumptions: Assumption[];

  @BzEntityProp('nav', {
    relativeEntity: 'trigger'
  })
  triggers: Trigger[];

  @BzEntityProp('nav', {
    relativeEntity: 'generationAsset'
  })
  generationAssets: GenerationAsset[];

  @BzEntityProp('nav', {
    relativeEntity: 'teamJobReservation'
  })
  teamJobReservations: TeamJobReservation[];

  /**
   * Helper assessor to generate graph data
   * to support the use of nested data in
   * Gantt Chanrt.
   */
  makeGenerationGraphData(): GenGraphData {
    const graphData: GenGraphData = [];
    const triggers = [...this.triggers];

    triggers.sort((trig1, trig2) =>
      trig1.triggerStart < trig2.triggerStart ? -1 : 1
    );

    triggers.forEach(trig => {
      const trigGraph: TrigGrapData = [trig, []];

      const trigAtas = this.prioritizedATAs.filter(
        pata => pata.triggerAction.triggerId === trig.id
      );

      const gensAsetForTrig = [
        ...new Set(trigAtas.map(tata => tata.generationAsset))
      ];

      gensAsetForTrig.forEach(gaft => {
        const ataGrpah: AssetTrigActGraph = [gaft, []];

        const taskForGenAndTrig = this.prioritizedATAs.filter(
          pata =>
            pata.triggerAction.triggerId === trig.id &&
            pata.generationAssetId === gaft.id
        );

        ataGrpah[1] = taskForGenAndTrig;
        trigGraph[1].push(ataGrpah);
      });

      graphData.push(trigGraph);
    });

    return graphData;
  }

  get prioritizedATAs(): AssetTriggerAction[] {
    const allAtas = _l.flatMap(
      this.generationAssets,
      x => x.assetTriggerActions
    );

    return _l.orderBy(allAtas, [
      x => x.triggerAction.trigger.triggerStart,
      x => x.generationAsset.mxPosition,
      x => x.triggerAction.sequence
    ]);
  }
}
