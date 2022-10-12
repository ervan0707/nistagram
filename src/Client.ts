import { Request } from './core/request';
import { State } from './core/state';

export class Client {
  public state = new State();
  public request = new Request(this);
}
