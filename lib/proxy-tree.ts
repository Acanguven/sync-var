export type ProxyObject = {
  [key: string]: string | object | number | Function | ProxyObject;
  [key: number]: string | object | number | Function | ProxyObject;
}

export enum ProxyTreeChangeTypes {
  DELETE,
  SET,
  DEFINE_PROPERTY
}

export type ProxyTreeChangeCallback = (keyPath: string, type: ProxyTreeChangeTypes, value?: string, descriptor?: PropertyDescriptor) => void;

export class ProxyTree {
  static PROXY_ROOT = '____root';

  /**
   * Wraps property of the scope mutating it
   * @public
   * @param {T} obj
   * @param {keyof T} property
   * @param cb
   */
  static wrap<T>(obj: T, property: keyof T, cb: ProxyTreeChangeCallback) {
    if (!ProxyTree.isObject(obj[property])) throw new Error('ProxyTree.constructor can only be used for wrapping objects');

    obj[property] = ProxyTree.construct(Object.assign({}, obj[property]), cb) as any;
  }

  /**
   * Returns new proxy instance with provided scope
   * @public
   * @param {object} obj
   * @param cb
   * @return {Proxy}
   */
  static construct(obj: object, cb: ProxyTreeChangeCallback) {
    if (!ProxyTree.isObject(obj)) throw new Error('ProxyTree.constructor can only be used for wrapping objects');

    return ProxyTree.traverseObject(obj as ProxyObject, cb);
  }

  /**
   * Traverse object and generate proxy from it
   * @private
   * @param {ProxyObject} obj
   * @param cb
   * @param keyPath
   * @return {Proxy}
   */
  static traverseObject(obj: ProxyObject, cb: ProxyTreeChangeCallback, keyPath: string = ProxyTree.PROXY_ROOT) {
    return ProxyTree.bindProxy(Object.keys(obj).reduce((tree: ProxyObject, key: string) => {
      tree[key] = ProxyTree.isObject(obj[key]) ?
        ProxyTree.traverseObject(obj[key] as ProxyObject, cb, `${keyPath}.${key}`)
        : obj[key];
      return tree;
    }, {}), cb, `${keyPath}`);
  }

  /**
   * Generates proxy from object
   * @private
   * @param {ProxyObject} obj
   * @param cb
   * @param keyPath
   * @return {Proxy}
   */
  static bindProxy(obj: ProxyObject, cb: ProxyTreeChangeCallback, keyPath: string) {
    return new Proxy(obj, {
      get: (obj: ProxyObject, prop: string | number) => {
        return obj[prop];
      },
      set: (obj: ProxyObject, prop: string | number, value: any) => {
        const changeStatus = Reflect.set(obj, prop, ProxyTree.isObject(value) ?
          ProxyTree.traverseObject(value, cb, `${keyPath}.${prop}`)
          : value);
        if (changeStatus) {
          cb(`${keyPath}.${prop}`, ProxyTreeChangeTypes.SET, value);
        }
        return changeStatus;
      },
      deleteProperty(obj: ProxyObject, prop: string | number) {
        const changeStatus = Reflect.deleteProperty(obj, prop);
        if (changeStatus) {
          cb(`${keyPath}.${prop}`, ProxyTreeChangeTypes.DELETE);
        }
        return changeStatus;
      },
      defineProperty(obj: ProxyObject, prop: string | number, descriptor: PropertyDescriptor) {
        const {value, ...descriptorOptions} = descriptor;
        const traversedValue = ProxyTree.isObject(value) ?
          ProxyTree.traverseObject(value, cb, `${keyPath}.${prop}`)
          : value;
        const changeStatus = Reflect.defineProperty(obj, prop, {...descriptorOptions, value: traversedValue});
        if (changeStatus) {
          cb(`${keyPath}.${prop}`, ProxyTreeChangeTypes.DEFINE_PROPERTY, traversedValue, descriptorOptions);
        }
        return changeStatus;
      }
    });
  }

  /**
   * Checks if argument is an object
   * @param target
   * @return {boolean}
   */
  private static isObject = (target: any) => typeof target === 'object';
}
