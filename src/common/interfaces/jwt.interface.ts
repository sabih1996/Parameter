interface IDecodedToken {
  display_name: string;
  email: string;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  nbf: number;
  org_id: string;
  sub: string;
  user_id: string;
}

export { IDecodedToken };
