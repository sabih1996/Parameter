import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Metadata, status } from "@grpc/grpc-js";
import { JwksClient } from "jwks-rsa";
import { RpcException } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { IDecodedToken } from "@/common/interfaces/jwt.interface";

@Injectable()
export class AuthGuard implements CanActivate {
  jwksClient: JwksClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.jwksClient = new JwksClient({
      jwksUri: this.configService.get("JWKS_URI"),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const metadata: Metadata = context.getArgByIndex(1);
      const tokenWithBearer = metadata.get("authorization")[0];

      let token: string | null;
      if (typeof tokenWithBearer === "string") {
        token = tokenWithBearer.replace("Bearer ", "");
      }
      if (!token) {
        throw new UnauthorizedException();
      }

      const publicKey = await this.findSigningKey(this.retrieveKid(token));
      const verification = this.jwtService.verify<IDecodedToken>(token, {
        publicKey: publicKey,
      });
      // If org_id is not available than user_id will be used
      verification.org_id = verification.org_id ?? verification.user_id;

      metadata.set("user", verification as any);
    } catch (error) {
      //TODO: Log The error through logger
      throw new RpcException({
        message: "Forbidden Resource",
        code: status.UNAUTHENTICATED,
      });
    }
    return true;
  }

  async findSigningKey(keyId: string): Promise<string | null> {
    const keyData = await this.jwksClient.getSigningKey(keyId);

    if (keyData) {
      const { kid } = keyData;
      if (kid !== keyId) throw new Error("Invalid JWT token");

      return keyData.getPublicKey();
    } else {
      throw new Error("Invalid Sign-in Key");
    }
  }

  retrieveKid(token: string): string {
    const decodedJwt = this.jwtService.decode(token, { complete: true });
    const kid = decodedJwt["header"].kid;
    if (!kid) {
      throw new UnauthorizedException("Invalid JWT token: kid not found");
    }
    return kid;
  }
}
