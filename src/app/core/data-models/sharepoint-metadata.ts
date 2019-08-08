import { BreezeEntity } from './breeze-entity';
import { BzEntity } from '../decorators/bz-entity-annotation/bz-entity.decorator';
import { BzEntityProp } from '../decorators/bz-entity-annotation/bz-entity-prop.decorator';
import { ComplexType } from 'breeze-client';

// @ts-ignore
@BzEntity({
  isComplexType: true,
  shortName: '__metadata'
})
export class SharepointMetadata {
  readonly shortname = '__metadata';
  readonly repoName = '';

  @BzEntityProp('data')
  id: string;
  @BzEntityProp('data')
  uri: string;
  @BzEntityProp('data')
  etag: string;
  @BzEntityProp('data')
  type: string;
}
