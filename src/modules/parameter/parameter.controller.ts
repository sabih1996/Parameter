import { Controller, UseGuards } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { from } from "rxjs";
import { ParamService } from "./parameter.service";
import { AuthGuard } from "@/authentication/jwt-auth.guard";
import {
  Retrieve_Request,
  Create_Request,
  Delete_Request,
  Update_Request,
  List_Request,
  ParameterServiceController,
} from "@/proto/parameters";
import { Metadata } from "@grpc/grpc-js";

@Controller("parameter")
@UseGuards(AuthGuard)
export class ParamController implements ParameterServiceController {
  constructor(private readonly paramService: ParamService) {}

  @GrpcMethod("ParameterService", "retrieve")
  public retrieve(request: Retrieve_Request, metadata?: Metadata) {
    return from(this.paramService.retrieve(request, metadata));
  }

  @GrpcMethod("ParameterService", "create")
  public create(request: Create_Request, metadata?: Metadata) {
    return from(this.paramService.create(request, metadata));
  }

  @GrpcMethod("ParameterService", "update")
  public update(request: Update_Request, metadata?: Metadata) {
    return from(this.paramService.update(request, metadata));
  }

  @GrpcMethod("ParameterService", "delete")
  public delete(request: Delete_Request, metadata?: Metadata) {
    return from(this.paramService.delete(request, metadata));
  }

  /**
   * @description list parameter
   */
  @GrpcMethod("ParameterService", "list")
  public list(request: List_Request, metadata?: Metadata) {
    return from(this.paramService.list(request, metadata));
  }
}
