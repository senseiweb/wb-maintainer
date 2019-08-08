import { GenerationAsset } from './generation-asset';
import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';

@BzEntity()
export class Asset extends SharepointEntity {
  readonly shortname = 'asset';

  @BzEntityProp('data', {
    dataCfg: { isNullable: false },
    spInternalName: 'Title'
  })
  alias: string;

  @BzEntityProp('data')
  location: string;

  @BzEntityProp('data')
  notes: string;

  @BzEntityProp('nav', {
    relativeEntity: 'generationAsset'
  })
  assetGenerations: GenerationAsset[];
}
