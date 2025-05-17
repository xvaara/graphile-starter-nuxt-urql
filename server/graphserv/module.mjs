import { createVerify } from 'crypto';
import { GraphQLError } from 'graphql';
import graphqlDepthLimit from 'graphql-depth-limit';
import { getVariableValues, getArgumentValues } from 'graphql/execution/values';
import { Pool } from 'pg';
import { debugPgClient } from 'postgraphile';

const HOUR = 3600000;
const DAY = 24 * HOUR;

// Constants for cost calculations
const DEFAULT_UNBOUNDED_ALL_COST = 100000;
const DEFAULT_COST_MULTIPLIER = 0.0005;
const DEFAULT_RELATION_COST_MULTIPLIER = 1.2;

function validateLicense(licenseKey) {
  const key = licenseKey || process.env.GRAPHILE_LICENSE;
  if (typeof key !== 'string') {
    throw new Error('You must set the GRAPHILE_LICENSE environmental variable to use @graphile/pro, find out more: https://www.graphile.org/postgraphile/plugins/#first-party-premium-plugins');
  }

  let parsedLicense;
  const buf = Buffer.from(String(key), 'base64');

  if (buf.length > 7 && (buf.readUInt8(buf.length - 1) & 7) === 0) {
    const version = buf.readUInt8(buf.length - 1) >> 3;
    const sigLength = buf.readUInt8(buf.length - 2);

    if (buf.length > 5 + sigLength) {
      const signature = buf.slice(2, 2 + sigLength);
      const payload = buf.slice(2 + sigLength, buf.length - 2);

      if (version === 0) {
        const verify = createVerify('SHA256');
        verify.write(payload);
        verify.end();

        if (verify.verify(
          '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiapOpoQOUtpoIoJjCZPyAiX51aIt\nwMJFV4OIttJG7N7EVGOAsgLddp02m8M35S82aHwCHW/AqeBbDpcCVvKGsQ==\n-----END PUBLIC KEY-----',
          signature
        )) {
          try {
            parsedLicense = JSON.parse(payload.toString('utf8'));
          } catch (error) {
            console.error('Failed to parse license:', error);
            throw new Error('Invalid (corrupt) license file');
          }
        }
      }
    }
  }

  if (!parsedLicense) {
    throw new Error('Invalid license key');
  }

  const { t: licensedTo, g: grantedFeatures, e: expiresAt } = parsedLicense;

  if ((grantedFeatures & 2) !== 2) {
    throw new Error('Your license does not cover usage of the @graphile/pro module');
  }

  if (expiresAt < Date.now()) {
    throw new Error('Your Graphile license has expired, please renew it!');
  }

  if (expiresAt < Date.now() + 90 * DAY) {
    const timeLeft = expiresAt - Date.now();
    const daysLeft = Math.floor(timeLeft / DAY);
    const hoursLeft = Math.floor((timeLeft - daysLeft * DAY) / HOUR);

    console.error(`\n\n⚠️ ⚠️ ⚠️ \n\nYour Graphile license key will expire in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'}, please update it at the Graphile Store.\n\n⚠️ ⚠️ ⚠️ \n\n`);
  }

  return { licensedTo };
}

function getConstructorName(obj) {
  return obj && typeof obj.constructor === 'function' && obj.constructor.name && String(obj.constructor.name) || null;
}

let isDisabled = false;

// Cost plugin implementation
export const PgCostsPlugin = (builder) => {
  function addCosts(field, cost, multiplier, defaultLimit = 1000, defaultChildCost = 0.12) {
    return {
      ...field,
      extensions: {
        ...field.extensions,
        graphilePro: {
          ...field.extensions?.graphilePro,
          getCosts(args) {
            const { first, last } = args;
            const limit = first || last || defaultLimit;
            const scale = limit === 0 ? 0 : 1 * Math.pow(limit + 3, 0.95);
            return {
              cost,
              baseChildCost: defaultChildCost,
              multiplier: Math.max(1, multiplier * scale)
            };
          }
        }
      }
    };
  }

  function addFixedCosts(field, costs) {
    const costObj = typeof costs === 'number' ? { cost: costs } : costs;
    return {
      ...field,
      extensions: {
        ...field.extensions,
        graphilePro: {
          ...field.extensions?.graphilePro,
          getCosts: () => costObj
        }
      }
    };
  }

  builder.hook('GraphQLObjectType:fields:field', (field, _build, context) => {
    const { scope: { isLiveField, originalField } } = context;
    if (!isLiveField) return field;

    const getCosts = field.extensions?.graphilePro?.getCosts || originalField.extensions?.graphilePro?.getCosts;

    if (getCosts) {
      return {
        ...field,
        extensions: {
          ...field.extensions,
          graphilePro: {
            ...field.extensions?.graphilePro,
            getCosts(...args) {
              const costs = getCosts.apply(this, args);
              return {
                ...costs,
                cost: 10 * costs.cost
              };
            }
          }
        }
      };
    }
    return field;
  });

  builder.hook('GraphQLObjectType:fields:field', (field, _build, { scope }) => {
    const {
      isRootQuery,
      isPgFieldConnection,
      isPgFieldSimpleCollection,
      isPgConnectionTotalCountField,
      isPgRowConnectionType,
      isPageInfoHasNextPageField,
      isPageInfoHasPreviousPageField,
      isPgForwardRelationField,
      isPgBackwardRelationField,
      pgFieldIntrospection,
      fieldName
    } = scope;

    if (isPgFieldConnection || isPgFieldSimpleCollection) {
      if (pgFieldIntrospection && pgFieldIntrospection.kind === 'class') {
        return isRootQuery
          ? addCosts(field, 1, 1, parseInt(pgFieldIntrospection.tags.unboundedAllCost, 10) || DEFAULT_UNBOUNDED_ALL_COST)
          : addCosts(field, 0.06, DEFAULT_RELATION_COST_MULTIPLIER, parseInt(pgFieldIntrospection.tags.unboundedRelationCost, 10) || 1000);
      } else if (pgFieldIntrospection && pgFieldIntrospection.kind === 'procedure') {
        return isRootQuery
          ? addCosts(field, (pgFieldIntrospection.cost || 100) * DEFAULT_COST_MULTIPLIER, 1, parseInt(pgFieldIntrospection.tags.unboundedCost, 10) || 1000)
          : addCosts(field, (pgFieldIntrospection.cost || 100) * DEFAULT_COST_MULTIPLIER, DEFAULT_RELATION_COST_MULTIPLIER, parseInt(pgFieldIntrospection.tags.unboundedCost, 10) || 50);
      }
      return addCosts(field, 2, DEFAULT_RELATION_COST_MULTIPLIER, DEFAULT_UNBOUNDED_ALL_COST);
    }

    if (isPgConnectionTotalCountField) {
      return pgFieldIntrospection && pgFieldIntrospection.kind === 'class'
        ? addFixedCosts(field, { cost: 2, useParentMultiplier: false })
        : addFixedCosts(field, { cost: 10, useParentMultiplier: false });
    }

    if (isPgRowConnectionType) {
      if (fieldName === 'pageInfo') {
        return addFixedCosts(field, { useParentMultiplier: false, multiplier: 1 });
      }
    } else {
      if (isPageInfoHasNextPageField || isPageInfoHasPreviousPageField) {
        return addFixedCosts(field, { cost: 7 });
      }
      if (isPgForwardRelationField) {
        return addFixedCosts(field, { cost: 0.06 });
      }
      if (isPgBackwardRelationField) {
        return addCosts(field, 0.06, DEFAULT_RELATION_COST_MULTIPLIER, 1000);
      }
      if (pgFieldIntrospection && pgFieldIntrospection.kind === 'procedure') {
        return addFixedCosts(field, { cost: (pgFieldIntrospection.cost || 100) * DEFAULT_COST_MULTIPLIER });
      }
    }

    return field;
  });
};

// Connection limit plugin implementation
export const PgForceConnectionLimitPlugin = (builder) => {
  builder.hook('GraphQLObjectType:fields:field', (field, _build, context) => {
    const { scope: { isLiveField, originalField } } = context;
    if (!isLiveField) return field;

    return {
      ...field,
      extensions: {
        ...field.extensions,
        graphilePro: {
          ...field.extensions?.graphilePro,
          paginationCap:
            field.extensions?.graphilePro?.paginationCap ??
            originalField.extensions?.graphilePro?.paginationCap
        }
      }
    };
  });

  builder.hook('GraphQLObjectType:fields:field', (field, _build, { scope }) => {
    const { isPgFieldConnection, isPgFieldSimpleCollection, pgFieldIntrospection, fieldName } = scope;

    if (!isPgFieldConnection && !isPgFieldSimpleCollection) return field;
    if (!pgFieldIntrospection || (pgFieldIntrospection.kind !== 'class' && pgFieldIntrospection.kind !== 'procedure')) return field;

    const cap = pgFieldIntrospection.tags.paginationCap != null
      ? parseInt(pgFieldIntrospection.tags.paginationCap, 10)
      : Infinity;

    if (cap === -1 || cap === undefined) return field;

    if (typeof cap !== 'number' || (!isFinite(cap) && cap !== Infinity) || cap < -1) {
      throw new Error(`Invalid pagination cap for '${fieldName}', expected a number but instead received '${cap}'`);
    }

    return {
      ...field,
      extensions: {
        ...field.extensions,
        graphilePro: {
          ...field.extensions?.graphilePro,
          paginationCap: cap,
          isPgFieldConnection,
          isPgFieldSimpleCollection
        }
      }
    };
  });
};

// Add validation rules
function createValidationRules({ operationName, variables, defaultPaginationCap }) {
  function validatePagination(context) {
    return {
      Document: {
        enter() {
          const { errors } = getVariableValues(context);
          if (errors) {
            errors.forEach(error => context.reportError(error));
          }
        }
      },
      Field: {
        enter(node) {
          const fieldDef = context.getFieldDef();
          if (!fieldDef) return;

          const cap = fieldDef.extensions?.graphilePro?.paginationCap === Infinity
            ? defaultPaginationCap
            : fieldDef.extensions?.graphilePro?.paginationCap;

          if (cap == null || !isFinite(cap) || cap < 0) return;

          if (!fieldDef.extensions?.graphilePro?.isPgFieldConnection ||
              (node.selectionSet && node.selectionSet.selections.find(s => s.kind === 'Field' && s.name.value === 'totalCount'))) {
            return;
          }

          let args;
          try {
            args = getArgumentValues(fieldDef, node, variables) || {};
          } catch (e) {
            context.reportError(e);
            return;
          }

          const { first, last } = args;
          if (!first && !last) {
            const fieldName = node.name.value;
            context.reportError(
              new GraphQLError(
                `You must provide a 'first' or 'last' argument to properly paginate the '${fieldName}' field.`,
                node
              )
            );
            return;
          }

          const limit = first || last;
          if (limit < 0) {
            const fieldName = node.name.value;
            context.reportError(
              new GraphQLError(
                `Invalid pagination limit '${limit}' on field '${fieldName}', please pass an integer greater than zero.`,
                node
              )
            );
          } else if (limit > cap) {
            const fieldName = node.name.value;
            context.reportError(
              new GraphQLError(
                `Invalid pagination limit '${limit}' on field '${fieldName}', please pass an integer no larger than '${cap}'.`,
                node
              )
            );
          }
        }
      }
    };
  }

  return validatePagination;
}

// Export default configuration with validation rules and context handling
export default {
  'cli:flags:add:standard': (addFlag) => {
    addFlag('--read-only-connection <string>', '⚡️pass the PostgreSQL connection string to use for read-only queries (i.e. not mutations) - typically for connecting to replicas via PgBouncer or similar');
    return addFlag;
  },

  'cli:flags:add': (addFlag) => {
    addFlag('--default-pagination-cap [int]', '⚡️Ensures all connections have first/last specified and are no large than this value (default: 50), set to \' -1\' to disable; override via smart comment `@paginationCap 50`');
    addFlag('--graphql-depth-limit [int]', '⚡️Validates GraphQL queries cannot be deeper than the specified int (default: 16), set to \' -1\' to disable');
    addFlag('--graphql-cost-limit [int]', '⚡️[experimental] Only allows queries with a computed cost below the specified int (default: 30000), set to \' -1\' to disable');
    return addFlag;
  },

  'cli:library:options': (options, { config, cliOptions }) => {
    const mergedOptions = { ...config.options, ...cliOptions };
    const {
      defaultPaginationCap,
      graphqlDepthLimit,
      graphqlCostLimit,
      exposeGraphQLCost = true,
      readOnlyConnection
    } = mergedOptions;

    return {
      ...options,
      defaultPaginationCap: parseInt(String(defaultPaginationCap || ''), 10) || 50,
      graphqlDepthLimit: parseInt(String(graphqlDepthLimit || ''), 10) || 16,
      graphqlCostLimit: parseInt(String(graphqlCostLimit || ''), 10) || 30000,
      exposeGraphQLCost,
      readOnlyConnection
    };
  },

  'cli:greeting': (messages, { options }) => {
    const { license } = options;
    try {
      const { licensedTo } = validateLicense(license);
      return [...messages, `@graphile/pro:       v1.0.4, licensed to '${licensedTo}'`];
    } catch (error) {
      isDisabled = true;
      return [...messages, `@graphile/pro IS DISABLED - INVALID LICENSE: ${error.message}`];
    }
  },

  'postgraphile:options': (options) => {
    const {
      defaultPaginationCap,
      graphqlDepthLimit,
      graphqlCostLimit,
      exposeGraphQLCost = true,
      readOnlyConnection,
      license,
      allowExplain
    } = options;

    try {
      validateLicense(license);
    } catch (error) {
      isDisabled = true;
      console.error();
      console.error();
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error();
      console.error(`ERROR: @graphile/pro IS DISABLED (due to invalid/expired license), none of its protections will function. ${error.message}`);
      console.error();
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error();
      console.error();
      return options;
    }

    let readReplicaPgPool;
    if (readOnlyConnection) {
      const poolInput = readOnlyConnection;
      const isPoolInstance =
        poolInput instanceof Pool ||
        (poolInput && typeof poolInput.constructor === 'function' && poolInput.constructor === Pool.super_) ||
        (poolInput && typeof poolInput === 'object' &&
         (getConstructorName(poolInput) === 'Pool' || getConstructorName(poolInput) === 'BoundPool') &&
         poolInput.Client && poolInput.options &&
         typeof poolInput.connect === 'function' &&
         typeof poolInput.end === 'function' &&
         typeof poolInput.query === 'function');

      readReplicaPgPool = isPoolInstance ? poolInput : new Pool(
        typeof poolInput === 'string' ? { connectionString: poolInput } : poolInput || {}
      );

      readReplicaPgPool.on('error', (error) => {
        console.error('Read only PostgreSQL client generated error: ', error.message);
      });

      if (debugPgClient) {
        readReplicaPgPool.on('connect', (client) => {
          debugPgClient(client, !!allowExplain);
        });
      }
    }

    return {
      ...options,
      graphqlDepthLimit: graphqlDepthLimit != null ? graphqlDepthLimit : 16,
      graphqlCostLimit: graphqlCostLimit != null ? graphqlCostLimit : 30000,
      exposeGraphQLCost,
      readReplicaPgPool,
      appendPlugins: [...(options.appendPlugins || []), PgCostsPlugin, PgForceConnectionLimitPlugin],
      graphileBuildOptions: {
        ...options.graphileBuildOptions,
        defaultPaginationCap: defaultPaginationCap != null ? defaultPaginationCap : 50
      }
    };
  },

  'postgraphile:httpParamsList': (params, { options, httpError }) => {
    if (isDisabled) return params;
    const { batchedQueryLimit = 10 } = options;
    if (params.length > batchedQueryLimit) {
      throw httpError(400, `Too many batched queries, send no more than ${batchedQueryLimit}`);
    }
    return params;
  },

  'postgraphile:validationRules': (rules, { options, req, operationName, variables, meta }) => {
    if (isDisabled) return rules;

    const { overrideOptionsForRequest } = options;
    const { defaultPaginationCap, graphqlDepthLimit: depthLimit, graphqlCostLimit, exposeGraphQLCost = true } =
      typeof overrideOptionsForRequest === 'function'
        ? { ...options, ...overrideOptionsForRequest(req, { options }) }
        : options;

    return [
      ...rules,
      createValidationRules({ operationName, variables, defaultPaginationCap }),
      ...(depthLimit >= 0 ? [graphqlDepthLimit(depthLimit)] : []),
      ...(graphqlCostLimit >= 0 ? [
        {
          costLimit: graphqlCostLimit,
          onComplete(cost) {
            if (exposeGraphQLCost && meta) {
              meta.graphqlQueryCost = cost;
            }
          }
        }
      ] : [])
    ];
  },

  'withPostGraphileContext': (withContext, { options }) => {
    if (isDisabled) return withContext;

    const { readReplicaPgPool, queryDocumentAst, operationName } = options;
    if (!readReplicaPgPool) return withContext;

    const document = queryDocumentAst;
    if (document && document.kind === 'Document') {
      const operation = document.definitions.find(
        def => def.kind === 'OperationDefinition' && (!operationName || (def.name && def.name.value === operationName))
      );

      if (operation) {
        const operationType = operation.operation;
        if (operationType === 'query' || operationType === 'subscription') {
          return (context, args) => withContext({ ...context, pgPool: readReplicaPgPool }, args);
        }
      }
    }

    return withContext;
  }
};
