import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';
import { Asset } from './asset';
import { AssetTriggerAction } from './asset-trigger-action';
import { Generation } from './generation';
import * as _l from 'lodash';

export type AssetStatus = 'FMC' | 'PMC' | 'NMC' | 'UNSET';

@BzEntity()
export class GenerationAsset extends SharepointEntity {
  readonly shortname = 'generationAsset';

  /**
   * When used, indicates that child entity will be deleted
   * during the next save operation. Prefer to use this method
   * when entities may be deleted and restored several times
   * before actual saving is done to store.
   *
   * Used instead of Breeze internal setDeleted() method becuase
   * setDeleted() assume the entity will not longer be reference, '
   * which cases all child and parent references to this entity
   * be dropped and a pain in the butt to be recovered later.
   */
  isSoftDeleted?: boolean;

  @BzEntityProp('data', {
    spInternalName: 'Title'
  })
  health: AssetStatus;

  @BzEntityProp('data')
  mxPosition: number;

  @BzEntityProp('nav', {
    relativeEntity: 'asset',
    navCfg: {
      isScalar: true
    }
  })
  asset: Asset;

  @BzEntityProp('nav', {
    relativeEntity: 'generation',
    navCfg: {
      isScalar: true
    }
  })
  generation: Generation;

  @BzEntityProp('data', {
    dataCfg: { isNullable: false }
  })
  generationId: number;

  @BzEntityProp('data', {
    dataCfg: {
      isNullable: false
    }
  })
  assetId: number;

  @BzEntityProp('nav', {
    relativeEntity: 'assetTriggerAction'
  })
  assetTriggerActions: AssetTriggerAction[];

  protected initializer(entity: this) {}
}
