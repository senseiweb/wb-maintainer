import {
  SpPropDecoratorKind,
  ISpEntityPropNavDecorator,
  ISpEntityPropDataDecorator,
  SpEntityPropDecorator,
  ISpEntityCustomValidator,
  ExtractConfigParameters
} from '@app_types/entity-extension';
import { Validator, DataType } from 'breeze-client';
import { SharepointEntity } from 'app/core/data-models/sharepoint-entity';
import { SharepointMetadata } from 'app/core/data-models/sharepoint-metadata';

/**
 * Helper method that uses a property's type to translate into a standard Breeze
 * Datatype. Any unknown types will throw an error.
 */
const translateDataType = (
  _arg: ISpEntityPropDataDecorator,
  keyPropType: string
) => {
  if (!_arg.dataCfg.dataType && !_arg.dataCfg.complexTypeName) {
    switch (keyPropType.toLowerCase()) {
      case 'string':
        _arg.dataCfg.dataType = DataType.String;
        break;
      case 'number':
        _arg.dataCfg.dataType = DataType.Int16;
        break;
      case 'boolean':
        _arg.dataCfg.dataType = DataType.Boolean;
        break;
      case 'date':
        _arg.dataCfg.dataType = DataType.DateTime;
        break;
      default:
        throw new Error(`Datatype ${keyPropType} unknown or missing on Entity`);
    }
  }
};

/**
 * A part of the scaffold decorators to setup and
 * register classes as Breeze entities. When decorated
 * on class members, an instance of this class will be created on the
 * classes prototype as "propCollection" [[IBreezeScaffoldProto]].
 */
export class SpEntityPropDecorArgCollection {
  props: SpEntityPropDecorator[] = [];
  propNameDictionary: Map<string, { [index: string]: string }> = new Map();
  customBzValidators: {
    propVal: Map<string, Array<() => Validator>>;
    entityVal: Array<ISpEntityCustomValidator<any>>;
  } = {
    propVal: new Map(),
    entityVal: []
  };
}

/**
 * A property decorator factory takes in the string value of the property type TPropKind i.e.
 * "data" or "nav", and filters the expected args ExtractConfigParameters minus the
 * the TPropType property.
 */
export function SpEntityProp<TPropKind extends SpPropDecoratorKind>(
  type: TPropKind,
  args: ExtractConfigParameters<SpEntityPropDecorator, TPropKind>
) {
  return <TClass extends SharepointEntity | SharepointMetadata>(
    // proto: Pick<TClass, keyof TClass>,
    proto: any,
    key: string
  ): void => {
    /**
     * Check if the class has the propCollection attribute already, if not add it to
     * the class as non enumerable so that Breeze does not add it as unmapped property
     * during registering of the ctor.
     * Object.getOwnPropertyDescriptor When checking ensure that we are looking at the
     * current classes property and not the base class prototype
     */
    if (!Object.getOwnPropertyDescriptor(proto, 'propCollection')) {
      Object.defineProperty(proto, 'propCollection', {
        enumerable: false,
        value: new SpEntityPropDecorArgCollection(),
        writable: true,
        configurable: true
      });
    }

    const propCollection = (proto as any).propCollection;

    /** If a property is data property setup up the configuration appropriately  */
    if (type === 'data') {
      const arg: ISpEntityPropDataDecorator = args as any;
      arg.dataCfg = arg.dataCfg || {};
      arg.dataCfg.name = key;

      if (arg.spInternalName) {
        const nameDictKey = proto.constructor.name;

        if (propCollection.propNameDictionary.has(nameDictKey)) {
          const dictProp = propCollection.propNameDictionary.get(nameDictKey);
          dictProp[key] = arg.spInternalName;
        } else {
          propCollection.propNameDictionary.set(nameDictKey, {
            [key]: arg.spInternalName
          });
        }
      }

      // @ts-ignore
      translateDataType(
        arg,
        // @ts-ignore
        Reflect.getMetadata('design:type', proto, key).name
      );
    }

    if (type === 'nav') {
      const arg: ISpEntityPropNavDecorator = args as any;
      arg.navCfg = arg.navCfg || {};

      arg.navCfg.isScalar = !!(arg.navCfg && arg.navCfg.isScalar);
      arg.navCfg.name = key;
      arg.navCfg.entityTypeName = arg.relativeEntity;
      arg.navCfg.associationName = arg.navCfg.isScalar
        ? `${arg.relativeEntity}_${proto.constructor.name}`
        : `${proto.constructor.name}_${arg.relativeEntity}`;

      if (arg.navCfg.isScalar) {
        arg.navCfg.foreignKeyNames = arg.navCfg.foreignKeyNames || [key + 'Id'];
      }
    }
    (args as any).propType = type;
    propCollection.props.push(args as any);
  };
}
