import { User } from './User';

export interface Token {
  access_token: string;
  user: User;
}
