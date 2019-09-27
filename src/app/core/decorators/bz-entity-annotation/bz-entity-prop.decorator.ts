import {
  BzPropDecoratorKind,
  ISpEntityPropNavDecorator,
  IBzEntityPropDataDecorator,
  BzEntityPropDecorator,
  IBzEntityCustomValidator,
  ExtractConfigParameters,
  IBreezeScaffoldProto
} from '@app_types/entity-extension';
import { Validator, DataType } from 'breeze-client';
import { BreezeEntity } from 'app/core/data-models';

/**
 * Method Decorator for capturing Breeze entity initializer and assigned it to the
 * class prototype.
 */
export function BzEntityInitializer(proto, key, descritor) {
  proto.bzEntityInit = descritor;
}

/**
 * Decorator factory that takes are validatorc config param and returns a
 * propert decorator.
 * @param validatorConfig: expects the configuartion object from the decorated
 * validator located on individual entities. See [[IBzCustomValidator]]
 * @returns MethodDecorator
 */
export const BzCustomValidator = <T>(
  validatorConfig: IBzEntityCustomValidator<T>
) => {
  return (
    proto: IBreezeScaffoldProto | BreezeEntity,
    key: string,
    propDescript: PropertyDescriptor
  ) => {
    if (!Object.getOwnPropertyDescriptor(proto, 'propCollection')) {
      Object.defineProperty(proto, 'propCollection', {
        enumerable: false,
        value: new BzPropCollection(),
        writable: true,
        configurable: true
      });
    }

    validatorConfig.validator = propDescript.value;

    /** Register validator with Breeze */
    Validator.registerFactory(validatorConfig.validator as any, key);

    /**
     * Push all "property type" validators into the Map array for the
     * the property, if this is the first validator for the property
     * create a new entry.
     * --else--
     * assumed that if not a property custom validator, it must be
     * an entity level validator, so push the validator into the
     * entity level array of validators.
     */
    if (validatorConfig.validatorScope === 'property') {
      const validatorListForProp = (proto as IBreezeScaffoldProto).propCollection.customBzValidators.propVal.get(
        validatorConfig.targetedProperty
      );

      if (validatorListForProp) {
        validatorListForProp.push(validatorConfig.validator);
      } else {
        (proto as IBreezeScaffoldProto).propCollection.customBzValidators.propVal.set(
          validatorConfig.targetedProperty,
          [validatorConfig.validator]
        );
      }
    } else {
      (proto as IBreezeScaffoldProto).propCollection.customBzValidators.entityVal.push(
        validatorConfig
      );
    }
  };
};

export class BzPropCollection {
  props: BzEntityPropDecorator[] = [];
  propNameDictionary: Map<string, { [index: string]: string }> = new Map();
  customBzValidators: {
    propVal: Map<string, Array<() => Validator>>;
    entityVal: Array<IBzEntityCustomValidator<any>>;
  } = {
    propVal: new Map(),
    entityVal: []
  };
}

/**
 * Helper method that uses a property's type to translate into a standard Breeze
 * Datatype. Any unknown types will throw an error.
 */
const translateDataType = (
  _arg: IBzEntityPropDataDecorator,
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
export class BzEntityPropDecorArgCollection {
  props: BzEntityPropDecorator[] = [];
  propNameDictionary: Map<string, { [index: string]: string }> = new Map();
  customBzValidators: {
    propVal: Map<string, Array<() => Validator>>;
    entityVal: Array<IBzEntityCustomValidator<any>>;
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
export function BzEntityProp<TPropKind extends BzPropDecoratorKind>(
  type: TPropKind,
  args?: ExtractConfigParameters<BzEntityPropDecorator, TPropKind>
) {
  return <TClass extends BreezeEntity>(
    // proto: Pick<TClass, keyof TClass>,
    proto: any,
    key: string
  ): void => {
    if (key === 'shortname') {
      console.log(proto);
      console.log(key);
    }

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
        value: new BzEntityPropDecorArgCollection(),
        writable: true,
        configurable: true
      });
    }

    const propCollection = (proto as any).propCollection;
    args = args || ({} as any);

    /** If a property is data property setup up the configuration appropriately  */
    if (type === 'data') {
      const arg: IBzEntityPropDataDecorator = args as any;
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

      // normalizeRelativeName
      arg.relativeEntity = (arg.relativeEntity.charAt(0).toUpperCase() +
        arg.relativeEntity.slice(1)) as any;

      arg.navCfg.entityTypeName = arg.relativeEntity;
      arg.navCfg.associationName = arg.navCfg.isScalar
        ? `${arg.relativeEntity}_${proto.constructor.name}`
        : `${proto.constructor.name}_${arg.relativeEntity}`;

      if (arg.navCfg.isScalar) {
        arg.navCfg.foreignKeyNames = arg.navCfg.foreignKeyNames || [key + 'Id'];
      }
    }
    (args as any).kind = type;
    propCollection.props.push(args as any);
  };
}
