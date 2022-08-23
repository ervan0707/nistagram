import { Request } from './packages/request';
import { State } from './packages/state';

export class Client {
  public state = new State();
  public request = new Request(this);
}
