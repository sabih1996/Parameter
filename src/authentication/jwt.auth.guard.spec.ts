import { AuthGuard } from "./jwt-auth.guard"; // Mocked JwksClient
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import {
  BROKEN_TOKEN,
  JWKS_URI,
  VALID_TOKEN,
} from "@/test/constants/test/index";

describe("AuthGuard", () => {
  //Getting exception here that don't have type getArgByIndex which we need for mocking go with type any to pass test
  let guard: any;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          global: true,
          useFactory: async () => ({
            signOptions: {
              algorithm: "RS256",
            },
          }),

          inject: [ConfigService],
        }),
      ],
      providers: [
        JwtService,
        AuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key == "JWKS_URI") {
                return JWKS_URI;
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get(AuthGuard);
  });

  it("Should throw error If no token is provided", async () => {
    const context = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgByIndex: jest.fn(() => {
        return {
          get: jest.fn(() => {
            return "";
          }),
        };
      }),
    };

    await expect(guard.canActivate(context)).rejects.toThrow(RpcException);
  });

  it("Should throw error on invalid\\malformed token", async () => {
    const context = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgByIndex: jest.fn(() => {
        return {
          get: jest.fn(() => {
            return [`Bearer ${BROKEN_TOKEN}`];
          }),
        };
      }),
    };
    await expect(guard.canActivate(context)).rejects.toThrow(RpcException);
  });

  it("should not throw unauthorized error on valid (non expired) token", async () => {
    const context = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgByIndex: jest.fn(() => {
        return {
          set: jest.fn((key: string, value) => {
            return;
          }),
          get: jest.fn(() => {
            return [`Bearer ${VALID_TOKEN}`];
          }),
        };
      }),
    };
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });
});
