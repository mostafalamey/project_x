import Ajv, { type ValidateFunction } from "ajv";

export type SchemaKey =
  | "landmarks"
  | "masterplan"
  | "building"
  | "floor"
  | "tour"
  | "unit"
  | "model";

type SchemaLoader = () => Promise<{ default: unknown } | unknown>;

type ValidatorCache = Map<SchemaKey, ValidateFunction>;

const ajv = new Ajv({ allErrors: true, strict: false });

const validatorCache: ValidatorCache = new Map();

const devSchemaLoaders: Partial<Record<SchemaKey, SchemaLoader>> = import.meta
  .env.DEV
  ? {
      landmarks: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/landmarks.schema.json"
        ),
      masterplan: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/masterplan.schema.json"
        ),
      building: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/building.schema.json"
        ),
      floor: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/floor.schema.json"
        ),
      tour: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/tour.schema.json"
        ),
      unit: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/unit.schema.json"
        ),
      model: () =>
        import(
          "../../../specs/001-interactive-complex-viewer/contracts/model.schema.json"
        ),
    }
  : {};

const resolveLoader = (key: SchemaKey): SchemaLoader => {
  const loader = devSchemaLoaders[key];

  if (!loader) {
    return async () => {
      throw new Error(
        `Schema loader for "${key}" is only available in development mode.`
      );
    };
  }

  return loader;
};

const toSchemaObject = async (
  schemaOrModule: { default: unknown } | unknown
) => {
  if (
    schemaOrModule &&
    typeof schemaOrModule === "object" &&
    "default" in (schemaOrModule as object)
  ) {
    return (schemaOrModule as { default: unknown }).default;
  }

  return schemaOrModule;
};

export const loadValidator = async <T>(
  key: SchemaKey
): Promise<ValidateFunction<T>> => {
  const cached = validatorCache.get(key);

  if (cached) {
    return cached as ValidateFunction<T>;
  }

  const schemaModule = await resolveLoader(key)();
  const schema = await toSchemaObject(schemaModule);
  const validator = ajv.compile<T>(schema as object);

  validatorCache.set(key, validator);

  return validator as ValidateFunction<T>;
};

export const validateWithSchema = async <T>(
  key: SchemaKey,
  data: unknown
): Promise<T> => {
  const validator = await loadValidator<T>(key);

  if (!validator(data)) {
    throw new Error(ajv.errorsText(validator.errors));
  }

  return data as T;
};
