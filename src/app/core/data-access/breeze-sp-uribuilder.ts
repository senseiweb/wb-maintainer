import { Injectable } from '@angular/core';
import { CoreModule } from '../core.module';
import {
  EntityQuery,
  MetadataStore,
  breeze,
  Predicate,
  EntityType,
  config,
  UriBuilderAdapter,
  core
} from 'breeze-client';
import {
  PredicateExpression,
  UnaryPredicate
} from 'breeze-client/src/predicate';

export interface ISpQueryOptions {
  $filter?: string;
  $orderby?: string;
  $skip?: number;
  $top?: number;
  $select?: string;
  $inlinecount?: string;
  $expand?: string;
}

@Injectable({ providedIn: CoreModule })
export class SpUriBuilderOdataAdapter implements UriBuilderAdapter {
  constructor() {
    this.initClass();
  }
  private operatorMap = {
    contains: 'substringof'
  };

  name = 'sp-odata';

  // tslint:disable-next-line: member-ordering
  toODataFragmentVisitor = {
    passthruPredicate: this.fragVisitorPassthru(),
    unaryPredicate: this.fragVisitorUnaryPredicate(),
    binaryPredicate: this.fragVisitorBinaryPredicate(),
    andOrPredicate: this.fragVisitorAndOrpredicate(),
    anyAllPredicate: this.fragVisitorAnyAllPredicate(),
    litExpr: this.fragVisitorLitExpr(),
    propExpr: this.fragVisitorPropExpr(),
    fnExpr: this.fragVisitorfnExpr()
  };

  initClass(): void {
    const that = this;
    (Predicate.prototype as any).toODataFragment = function(context: any) {
      return this.visit(context, that.toODataFragmentVisitor);
    };
  }

  initialize = (): void => {};

  buildUri = (entityQuery: EntityQuery, store: MetadataStore): string => {
    let entityType = entityQuery._getToEntityType(store, false);

    if (!entityType) {
      entityType = new breeze.EntityType(store);
    }

    const queryOptions: ISpQueryOptions = {};

    queryOptions.$filter = this.toWhereODataFragment(
      entityType,
      entityQuery.wherePredicate
    );

    queryOptions.$orderby = this.toOrderByODataFragment(
      entityType,
      entityQuery.orderByClause
    );

    if (entityQuery.skipCount) {
      queryOptions.$skip = entityQuery.skipCount;
    }

    if (entityQuery.takeCount) {
      queryOptions.$top = entityQuery.takeCount;
    }

    queryOptions.$expand = this.toExpandODataFragment(
      entityType,
      entityQuery.expandClause
    );
    queryOptions.$select = this.toSelectODataFragment(
      entityType,
      entityQuery.selectClause
    );
    if (entityQuery.inlineCountEnabled) {
      queryOptions.$inlinecount = 'allpages';
    }
    entityQuery.spQueryOptions = queryOptions;

    const qoText = this.toQueryOptionsString(entityType, queryOptions);

    return (entityQuery.resourceName = qoText);
  }

  private fragVisitorPassthru(): () => any {
    return function() {
      return this.value;
    };
  }

  private fragVisitorUnaryPredicate(): (context: any) => any {
    const that = this;
    return function(context: any) {
      const predVal = this.pred.visit(context);
      return `${that.odataOpFrom(this)} (${predVal})`;
    };
  }

  private fragVisitorBinaryPredicate(): (context: any) => any {
    const that = this;

    return function(context) {
      let expr1Val = this.expr1Val.visit(context);
      const expr2Val = this.expr2Val.visit(context);
      const prefix = context.prefix;
      if (prefix) {
        expr1Val = `${prefix}/${expr1Val}`;
      }
      const odataOp = that.odataOpFrom(this);
      if (this.op.key === 'in') {
        const result = expr2Val
          .map((v: any) => `(${expr1Val} eq ${v})`)
          .join(' or ');
        return result;
      }

      if (this.op.isFunction) {
        return odataOp === 'substringof'
          ? `${odataOp} (${expr2Val}, ${expr1Val}) eq true`
          : `${odataOp} (${expr1Val}, ${expr2Val}) eq true`;
      }
      return `${expr1Val} ${odataOp} ${expr2Val}`;
    };
  }

  private fragVisitorAndOrpredicate(): (context: any) => any {
    const that = this;
    return function(context) {
      const result = this.preds
        .map((pred: any) => {
          const predVal = pred.visit(context);
          return `(${predVal})`;
        })
        .join(` ${that.odataOpFrom(this)} `);
      return result;
    };
  }

  private fragVisitorAnyAllPredicate(): (context: any) => string {
    const that = this;
    return function(context) {
      let exprVal = this.expr.visit(context);
      if (!this.pred.op) {
        return `${exprVal}/${that.odataOpFrom(this)}()`;
      }
      let prefix = context.prefix;
      if (prefix) {
        exprVal = `${prefix}/${exprVal}`;
        prefix = `x${parseInt(prefix.substring(1), 10) + 1}`;
      } else {
        prefix = 'x1';
      }
      const newContext = core.extend({}, context) as any;
      newContext.entityType = this.expr.dataType;
      newContext.prefix = prefix;
      const newPredVal = this.pred.visit(newContext);
      return `${exprVal}/${that.odataOpFrom(this)}(${prefix}: ${newPredVal})`;
    };
  }

  private fragVisitorLitExpr(): (context: any) => string {
    return function() {
      return Array.isArray(this.value)
        ? this.value.map((v: any) => this.dataType.fmtOData(v), this)
        : this.dataType.fmtOData(this.value);
    };
  }

  private fragVisitorPropExpr(): (context: any) => any {
    return function(context) {
      const entityType = context.entityType;
      return entityType
        ? entityType.clientPropertyPathToServer(this.propertyPath, '/')
        : this.propertyPath;
    };
  }

  private fragVisitorfnExpr(): (context: any) => any {
    return function(context) {
      const exprVals = this.exprs.map((expr: any) => expr.visit(context));
      return `${this.fnName}(${exprVals.join(',')})`;
    };
  }

  odataOpFrom = (node: any) => {
    const op = node.op.key;
    const odataOp = this.operatorMap[op];
    return odataOp || op;
  }

  private toWhereODataFragment = (
    entityType: EntityType,
    wherePredicate: PredicateExpression
  ) => {
    if (!wherePredicate) {
      return undefined;
    }

    const frag = wherePredicate.visit(
      { entityType },
      this.toODataFragmentVisitor
    );

    return frag && frag.length > 0 ? frag : undefined;
  }

  private toOrderByODataFragment(entityType: EntityType, orderByClause: any) {
    if (!orderByClause) {
      return undefined;
    }

    orderByClause.validate(entityType);

    const strings = orderByClause.items.map(
      (item: any) =>
        `${entityType.clientPropertyPathToServer(item.propertyPath, '/')}(${
          item.isDesc ? ' desc' : ''
        }
    `
    );

    // should return something like CompanyName,Address/City desc
    return strings.join(',');
  }
  private toSelectODataFragment(entityType: EntityType, selectClause: any) {
    if (!selectClause) {
      return undefined;
    }

    selectClause.validate(entityType);

    const frag = selectClause.propertyPaths
      .map((pp: any) => entityType.clientPropertyPathToServer(pp, '/'))
      .join(',');

    return frag;
  }
  private toExpandODataFragment(entityType: EntityType, expandClause: any) {
    if (!expandClause) {
      return undefined;
    }

    // no validate on expand clauses currently.
    // expandClause.validate(entityType);
    const frag = expandClause.propertyPaths
      .map((pp: any) => entityType.clientPropertyPathToServer(pp, '/'))
      .join(',');

    return frag;
  }

  private toQueryOptionsString(entityType: EntityType, queryOptions: any) {
    const qoStrings = [];
    const loop1 = (qoName: any) => {
      const qoValue = queryOptions[qoName];
      if (qoValue !== undefined) {
        if (Array.isArray(qoValue)) {
          qoValue.forEach((qov: any) => {
            qoStrings.push(qoName + '=' + encodeURIComponent(qov));
          });
        } else {
          qoStrings.push(qoName + '=' + encodeURIComponent(qoValue));
        }
      }
    };

    for (const qoName of queryOptions) {
      loop1(qoName);
    }

    if (qoStrings.length > 0) {
      return '?' + qoStrings.join('&');
    } else {
      return '';
    }
  }
}

config.registerAdapter('uriBuilder', SpUriBuilderOdataAdapter);
