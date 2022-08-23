export class State {
  private _uuid?: string;
  private _deviceId?: string;
  private _crfToken?: string;

  set uuid(value: string) {
    this._uuid = value;
  }

  get uuid() {
    return this._uuid || '';
  }

  set deviceId(value: string) {
    this._deviceId = value;
  }

  get deviceId() {
    return this._deviceId || '';
  }

  set crfToken(value: string) {
    this._crfToken = value;
  }

  get crfToken() {
    return this._crfToken || '';
  }
}
