/**
 * @jest-environment ../test/environment/test-environment.ts
 **/

import { ConfigModule } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParamService } from "./parameter.service";
import {
  mockCreateRequest,
  mockCreateResponse,
  mockDeleteRequest,
  mockUpdateRequest,
  mockUpdateResponse,
  mockRetrieveRequest,
} from "./tests/data";
import { LoggerService } from "@/shared/logger/logger.service";
import { Parameter } from "@/db/entities/parameter.entity";
import { Metadata } from "@grpc/grpc-js";
import { Create_Request } from "@/proto/parameters";

describe("ParameterService", () => {
  let service: ParamService;
  let module: TestingModule;

  let path: string;
  let randomNumber: number;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
          type: "postgres",
          url: process.env.DATABASE_URL,
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Parameter]),
      ],
      providers: [LoggerService, ParamService],
    }).compile();

    service = module.get<ParamService>(ParamService);

    randomNumber = Math.floor(Math.random() * 10000);

    path = `random_path/${randomNumber}`;
  });

  afterEach(async () => {
    await module.close();
  });

  // Organization id if not exists user id will be used
  const org_id = "org_2TWGp1gWnZkAQK6NxbKCADBu1RC";
  const metadata = new Metadata();
  metadata.set("user", {
    org_id,
  } as any);

  describe("Create Parameter Tests", () => {
    it("should create same number of parameters as provided in request", async () => {
      const { parameters } = mockCreateRequest(path);

      expect(
        (await service.create(mockCreateRequest(path), metadata)).parameters
      ).toHaveLength(parameters.length);
    });

    it("should create parameters with the given request body and return response in a specific pattern", async () => {
      expect(await service.create(mockCreateRequest(path), metadata)).toEqual(
        mockCreateResponse(path)
      );
    });

    it("should fail if same key is created twice and overwrite is not set", async () => {
      const request = mockCreateRequest(path);

      await service.create(request, metadata);

      await expect(service.create(request, metadata)).rejects.toThrowError();
    });

    it("should not fail if same key is created twice and overwrite is set", async () => {
      const request: Create_Request = mockCreateRequest(path);

      await service.create(request, metadata);
      request.overwrite = true;

      await expect(service.create(request, metadata)).resolves;
    });
  });

  describe("Update Parameter Tests", () => {
    it("should throw error because the parameters does not exists", async () => {
      await expect(
        service.update(mockUpdateRequest(path), metadata)
      ).rejects.toEqual(new RpcException("Parameter does not exists."));
    });
    it("should update successfully because the parameters provided was valid and return response in a specific pattern", async () => {
      const pathToTest = await service.create(
        mockCreateRequest(path),
        metadata
      );
      expect(
        await service.update(
          mockUpdateRequest(pathToTest.parameters[0].path),
          metadata
        )
      ).toEqual(mockUpdateResponse(pathToTest.parameters[0].path));
    });
  });

  describe("Delete Parameter Tests", () => {
    it("should return false because the parameters does not exists", async () => {
      expect(await service.delete(mockDeleteRequest(path), metadata)).toEqual({
        deleted: 0,
      });
    });

    it("should return true because the parameters gets deleted successfully", async () => {
      await service.create(mockCreateRequest(path), metadata);

      expect(await service.delete(mockDeleteRequest(path), metadata)).toEqual({
        deleted: 1,
      });
    });
  });

  describe("Retrieve Parameter Tests", () => {
    it("should throw error because the parameters does not exists", async () => {
      await expect(
        service.retrieve(
          mockRetrieveRequest("random_path_that_do_not_exist"),
          metadata
        )
      ).rejects.toEqual(new RpcException("Parameter does not exists."));
    });

    it("should return same number of parameter as the path provided in request", async () => {
      await service.create(mockCreateRequest(path), metadata);

      const { paths } = mockRetrieveRequest(path);

      expect(
        (await service.retrieve({ paths }, metadata)).parameters
      ).toHaveLength(paths.length);
    });

    it("should return a path up a single hierarchy", async () => {
      const path = `MYCONFIG-${randomNumber}.FEATURE1/MYORG/SITE1`;
      const result = { parameter: "aaa" };

      await service.create(mockCreateRequest(path, result), metadata);
      expect(
        await service.retrieve(mockRetrieveRequest(path), metadata)
      ).toEqual({
        parameters: [{ path, value: result }],
      });

      await service.delete(mockDeleteRequest(path), metadata);
    });

    it("should return a path by going up the hierarchy until found", async () => {
      const path = `MYCONFIG-${randomNumber}.FEATURE3`;
      const result = { parameter: "aaa" };

      await service.create(mockCreateRequest(path, result), metadata);

      expect(
        await service.retrieve(
          mockRetrieveRequest(`${path}/MYORG/MYSITEA`),
          metadata
        )
      ).toEqual({ parameters: [{ path, value: result }] });
    });
  });

  describe("List Parameter Tests", () => {
    it("should return all the parameters with the matching pattern", async () => {
      const queryPath = `MYCONFIG.*`;

      let path = `MYCONFIG.PARAM.A`;
      const value = { foo: "foo" };

      await service.create(mockCreateRequest(path, value), metadata);

      path = `MYCONFIG.PARAM.B`;
      await service.create(mockCreateRequest(path, value), metadata);

      expect(await service.list({ path: queryPath }, metadata)).toEqual({
        parameters: [
          { path: "MYCONFIG.PARAM.A", value: { foo: "foo" } },
          { path: "MYCONFIG.PARAM.B", value: { foo: "foo" } },
        ],
      });
    });

    it("should return the parameter with the exact match", async () => {
      const path = `MYCONFIG.PARAM.B`;

      expect(await service.list({ path }, metadata)).toEqual({
        parameters: [{ path, value: { foo: "foo" } }],
      });
    });
  });
});
