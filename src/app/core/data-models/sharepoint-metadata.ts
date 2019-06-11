import { SpEntity } from '../decorators/sp-entity-annotation/sp-entity.decorator';
import { SpEntityProp } from '../decorators/sp-entity-annotation/sp-entity-prop.decorator';

@SpEntity('Global', {
  isComplexType: true,
  namespace: 'SP.Data',
  shortName: '__metadata'
})
export class SharepointMetadata {
  readonly shortname = '__metadata';

  @SpEntityProp('data', {})
  id: string;
  @SpEntityProp('data', {})
  uri: string;
  @SpEntityProp('data', {})
  etag: string;
  @SpEntityProp('data', {})
  type: string;
}
