import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Like } from "typeorm";
import { RpcException } from "@nestjs/microservices";

import { LoggerService } from "@/shared/logger/logger.service";
import { Parameter } from "@/db/index.export";
import { groupBy } from "lodash";
import { Metadata } from "@grpc/grpc-js";
import { RedisCacheService } from "@/shared/services/redis-cache.service";

import {
  findMoreSpecificParameters,
  findUniqueKeysInParameters,
  findUnknownPaths,
  getOrganizationId,
  stepDownOnPaths,
  translate,
} from "@/common/helper/general.helper";
import {
  Create_Request,
  Create_Response,
  Update_Request,
  Retrieve_Request,
  Retrieve_Response,
  Delete_Request,
  Delete_Response,
  Update_Response,
  List_Request,
  List_Response,
  ParameterServiceController,
} from "@/proto/parameters";

@Injectable()
export class ParamService implements ParameterServiceController {
  constructor(
    @InjectRepository(Parameter)
    private readonly paramRepo: Repository<Parameter>,
    private readonly logger: LoggerService,
    private readonly redisCache: RedisCacheService
  ) {}

  public async retrieve(
    request: Retrieve_Request,
    metadata: Metadata
  ): Promise<Retrieve_Response> {
    const { paths } = request;
    const org_id = getOrganizationId(metadata);

    // Try to get parameters from cache first
    const cacheKeys = paths.map((path: string) => `param:${org_id}:${path}`);
    const cachedParams = await Promise.all(
      cacheKeys.map((key: string) => this.redisCache.get(key))
    );

    // Filter out cached parameters and find which ones need to be fetched from DB
    const uncachedPaths = paths.filter(
      (_: unknown, index: string | number) => !cachedParams[index]
    );
    const parameters = cachedParams.filter(Boolean);

    if (uncachedPaths.length > 0) {
      const dbParameters = await this.paramRepo.find({
        where: {
          path: In(uncachedPaths),
          org_id,
        },
        select: ["path", "value"],
      });

      // Cache the newly fetched parameters
      await Promise.all(
        dbParameters.map(
          (param) =>
            this.redisCache.set(`param:${org_id}:${param.path}`, param, 3600) // Cache for 1 hour
        )
      );

      parameters.push(...dbParameters);
    }

    if (paths.length !== parameters.length) {
      let unknownPaths = findUnknownPaths(paths, parameters);

      const orgLevelPath = stepDownOnPaths(unknownPaths);

      const orgLevelPathFound = await this.paramRepo.find({
        where: {
          path: In(orgLevelPath),
          org_id,
        },
        select: ["path", "value"],
      });

      // Cache org level parameters
      await Promise.all(
        orgLevelPathFound.map((param) =>
          this.redisCache.set(`param:${org_id}:${param.path}`, param, 3600)
        )
      );

      if (orgLevelPath.length !== orgLevelPathFound.length) {
        unknownPaths = findUnknownPaths(orgLevelPath, parameters);

        const baseLevelPath = stepDownOnPaths(unknownPaths);

        const baseLevelPathFound = await this.paramRepo.find({
          where: {
            path: In(baseLevelPath),
            org_id,
          },
          select: ["path", "value"],
        });

        // Cache base level parameters
        await Promise.all(
          baseLevelPathFound.map((param) =>
            this.redisCache.set(`param:${org_id}:${param.path}`, param, 3600)
          )
        );

        if (baseLevelPath.length !== baseLevelPathFound.length) {
          throw new RpcException(
            translate("errors", "not_found", {
              ":replacement": "Parameter",
            })
          );
        }

        return {
          parameters: [
            ...parameters,
            ...orgLevelPathFound,
            ...baseLevelPathFound,
          ],
        };
      }

      parameters.push(...orgLevelPathFound);
    }

    return { parameters: [...parameters] };
  }

  public async create(
    request: Create_Request,
    metadata: Metadata
  ): Promise<Create_Response> {
    const paths = request.parameters.map((param) => param.path);
    const org_id = getOrganizationId(metadata);
    const checkDuplicate = await this.paramRepo.find({
      where: {
        path: In(paths),
        org_id,
      },
    });

    if (checkDuplicate.length && !request.overwrite) {
      throw new RpcException(
        translate("errors", "already_exists", {
          ":replacement": "Parameter",
        })
      );
    }

    const createdParameters = await this.paramRepo.save(
      request.parameters.map((param) => {
        return { ...param, org_id };
      })
    );

    // Cache the newly created parameters
    await Promise.all(
      createdParameters.map((param) =>
        this.redisCache.set(`param:${org_id}:${param.path}`, param, 3600)
      )
    );

    return {
      parameters: createdParameters.map((param) => {
        return { path: param.path, value: param.value };
      }),
    };
  }

  public async update(
    request: Update_Request,
    metadata: Metadata
  ): Promise<Update_Response> {
    const paths = request.parameters.map((param) => param.path);
    const org_id = getOrganizationId(metadata);

    const existingParameters = await this.paramRepo.find({
      where: { org_id, path: In(paths) },
    });

    if (existingParameters.length !== request.parameters.length) {
      throw new RpcException(
        translate("errors", "not_found", {
          ":replacement": "Parameter",
        })
      );
    }

    let updatedParameters = existingParameters.map((param) => {
      param.value =
        request.parameters.find((p) => p.path === param.path)?.value ||
        param.value;
      return param;
    });

    updatedParameters = await this.paramRepo.save(updatedParameters);

    // Update cache with new values
    await Promise.all(
      updatedParameters.map((param) =>
        this.redisCache.set(`param:${org_id}:${param.path}`, param, 3600)
      )
    );

    return {
      parameters: updatedParameters.map((param) => {
        return { path: param.path, value: param.value };
      }),
    };
  }

  public async delete(
    request: Delete_Request,
    metadata?: Metadata
  ): Promise<Delete_Response> {
    const org_id = getOrganizationId(metadata);
    const { affected: deleted } = await this.paramRepo.delete({
      path: In(request.paths),
      org_id,
    });

    // Remove deleted parameters from cache
    await Promise.all(
      request.paths.map((path) =>
        this.redisCache.del(`param:${org_id}:${path}`)
      )
    );

    return { deleted };
  }

  public async list(
    request: List_Request,
    metadata: Metadata
  ): Promise<List_Response> {
    const { path } = request;

    const filteredParameters = [];
    const org_id = getOrganizationId(metadata);

    if (path.includes("*")) {
      const parameters = await this.paramRepo.find({
        where: {
          path: Like(path.replace("*", "%")),
          org_id,
        },
        select: ["path", "value"],
      });

      const uniqueKeys = findUniqueKeysInParameters(parameters);

      findMoreSpecificParameters(
        uniqueKeys,
        groupBy(parameters, "path"),
        filteredParameters
      );

      return { parameters: filteredParameters };
    }

    return {
      parameters: await this.paramRepo.find({
        where: {
          path,
          org_id,
        },
        select: ["path", "value"],
      }),
    };
  }
}
