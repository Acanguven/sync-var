export type ProxyObject = {
  [key: string]: string | object | number | Function | ProxyObject;
  [key: number]: string | object | number | Function | ProxyObject;
}

export class ProxyTree {
  /**
   * Wraps
   * @param {T} obj
   * @param {keyof T} property
   */
  static wrap<T>(obj: T, property: keyof T) {
    if (!this.isObject(obj[property])) throw new Error('ProxyTree.constructor can only be used for wrapping objects');

    obj[property] = this.construct(Object.assign({}, obj[property])) as any;
  }

  static construct(obj: object) {
    if (!this.isObject(obj)) throw new Error('ProxyTree.constructor can only be used for wrapping objects');

    return this.traverseObject(obj as ProxyObject);
  }

  static traverseObject(obj: ProxyObject): ProxyObject {
    return this.bindProxy(Object.keys(obj).reduce((tree: ProxyObject, key: string) => {
      tree[key] = this.isObject(obj[key]) ?
        this.traverseObject(obj[key] as ProxyObject)
        : obj[key];
      return tree;
    }, {}));
  }

  static bindProxy(obj: ProxyObject) {
    return new Proxy(obj, {
      get: (obj: ProxyObject, prop: string | number) => {
        return obj[prop];
      },
      set: (obj: ProxyObject, prop: string | number, value: any) => {
        obj[prop] = this.isObject(value) ? this.traverseObject(value) : value;
        return true;
      }
    });
  }

  private static isObject = (target: any) => typeof target === 'object';
}






