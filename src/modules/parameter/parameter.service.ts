import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Like } from "typeorm";
import { RpcException } from "@nestjs/microservices";

import { LoggerService } from "@/shared/logger/logger.service";
import { Parameter } from "@/db/index.export";
import { groupBy } from "lodash";
import { Metadata } from "@grpc/grpc-js";

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
    private readonly logger: LoggerService
  ) {}

  public async retrieve(
    request: Retrieve_Request,
    metadata: Metadata
  ): Promise<Retrieve_Response> {
    const { paths } = request;
    const org_id = getOrganizationId(metadata);
    const parameters = await this.paramRepo.find({
      where: {
        path: In(paths),
        org_id,
      },
      select: ["path", "value"],
    });

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
