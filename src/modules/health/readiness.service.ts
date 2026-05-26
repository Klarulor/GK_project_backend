import { Injectable } from "@nestjs/common";

@Injectable()
export class ReadinessService {
  private _isAppReady = false;

  /**
   * Маркирует приложение как полностью готовое к приему трафика.
   * Вызывается после инициализации всех подсистем.
   */
  markAsReady(): void {
    this._isAppReady = true;
  }

  isReady(): boolean {
    return this._isAppReady;
  }
}
