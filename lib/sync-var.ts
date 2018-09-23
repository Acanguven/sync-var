import {ProxyObject, ProxyTree, ProxyTreeChangeCallback, ProxyTreeChangeTypes} from "./proxy-tree";

export enum SYNC_METHODS {
  HTTP,
  TCP
}

export interface ConnectConfig {
  method: SYNC_METHODS;
  host: string;
}

export interface SyncVar {
  bind(key: string, variable: object): ProxyObject;

  bind<T>(key: string, scope: T, property: keyof T): void;

  connect(key: string, options?: ConnectConfig): object;
}

export class SyncVar implements SyncVar {
  static connect(key: string, options: ConnectConfig): object {
    return {};
  }

  static bind<T>(key: string, variable: T, property: keyof T): ProxyObject | void {
    if (property) {
      ProxyTree.wrap(variable, property, this.onChangeNotification.bind(this));
    } else {
      return ProxyTree.construct(variable as any, this.onChangeNotification.bind(this));
    }
  }

  private static onChangeNotification(keyPath: string, type: ProxyTreeChangeTypes, value?: string, descriptor?: PropertyDescriptor) {
    console.log(keyPath, type, value, descriptor);
  }
}

