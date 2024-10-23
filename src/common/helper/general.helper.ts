import lang from "@/shared/lang";
import {
  Dictionary,
  find,
  get,
  isObject,
  isString,
  pickBy,
  replace,
} from "lodash";
import { Parameter } from "@/db/entities/parameter.entity";

export const translate = (type: string, key: string, replacement = null) => {
  let text = get(lang[type], key);

  if (replacement && isObject(replacement)) {
    for (const i in replacement) {
      if (isString(replacement[i])) {
        text = replace(text, i, replacement[i]);
      }
    }
  }

  return text;
};

export const stripTrailingSlash = (str: string) => {
  return str.endsWith("/") ? str.slice(0, -1) : str;
};

export const findUnknownPaths = (
  givenPaths: string[],
  foundParamaters: Parameter[]
) => {
  const pathsNotFound = [];
  givenPaths.forEach((element) => {
    const found = find(foundParamaters, { path: element });
    if (!found) {
      pathsNotFound.push(element);
    }
  });
  return pathsNotFound;
};

export const stepDownOnPaths = (unknownPaths: string[]) => {
  const steppedDownPaths = [];
  unknownPaths.forEach((path) => {
    path = path.split("/").slice(0, -1).join("/");
    steppedDownPaths.push(path);
  });

  return steppedDownPaths;
};

export const findUniqueKeysInParameters = (parameters: Parameter[]) => {
  const uniqueKeys = [];
  parameters.forEach((parameter) => {
    const key = parameter.path.split("/")[0];
    if (!uniqueKeys.includes(key)) uniqueKeys.push(key);
  });

  return uniqueKeys;
};

export const findMoreSpecificParameters = (
  uniqueKeys: string[],
  groupedKeys: Dictionary<Parameter[]>,
  filteredParameters: Parameter[]
) => {
  uniqueKeys.forEach((uniqueKey) => {
    const result = pickBy(groupedKeys, (value, key) =>
      key.startsWith(uniqueKey)
    );
    const levels = Object.keys(result);

    if (levels.length <= 1) {
      filteredParameters.push(result[uniqueKey]?.pop());
      uniqueKeys = uniqueKeys.filter((key) => key !== uniqueKey);
    } else {
      let length = 0;
      Object.entries(result).forEach(([key]) => {
        const splittedKeysLength = key.split("/").length;
        if (splittedKeysLength > length) {
          length = splittedKeysLength;
          filteredParameters.push(result[key]?.pop());
        }
      });
    }
  });
};

// Returns organization id if exists else user id from metadata
export const getOrganizationId = (metadata) =>
  metadata.get("user")[0]["org_id"];
