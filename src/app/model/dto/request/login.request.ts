export class LoginRequest {
  username: string;
  password: string;

  constructor(data: ILoginRequest) {
    this.username = data.username;
    this.password = data.password;
  }
}

export interface ILoginRequest {
  username: string;
  password: string;
}
