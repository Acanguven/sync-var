export type ProxyObject = {
  [key: string]: string | object | number | Function | ProxyObject;
  [key: number]: string | object | number | Function | ProxyObject;
}

export class ProxyTree {
  /**
   * Wraps property of the scope mutating it
   * @public
   * @param {T} obj
   * @param {keyof T} property
   */
  static wrap<T>(obj: T, property: keyof T) {
    if (!this.isObject(obj[property])) throw new Error('ProxyTree.constructor can only be used for wrapping objects');

    obj[property] = this.construct(Object.assign({}, obj[property])) as any;
  }

  /**
   * Returns new proxy instance with provided scope
   * @public
   * @param {object} obj
   * @return {Proxy}
   */
  static construct(obj: object) {
    if (!this.isObject(obj)) throw new Error('ProxyTree.constructor can only be used for wrapping objects');

    return this.traverseObject(obj as ProxyObject);
  }

  /**
   * Traverse object and generate proxy from it
   * @private
   * @param {ProxyObject} obj
   * @return {Proxy}
   */
  static traverseObject(obj: ProxyObject) {
    return this.bindProxy(Object.keys(obj).reduce((tree: ProxyObject, key: string) => {
      tree[key] = this.isObject(obj[key]) ?
        this.traverseObject(obj[key] as ProxyObject)
        : obj[key];
      return tree;
    }, {}));
  }

  /**
   * Generates proxy from object
   * @private
   * @param {ProxyObject} obj
   * @return {Proxy}
   */
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

  /**
   * Checks if argument is an object
   * @param target
   * @return {boolean}
   */
  private static isObject = (target: any) => typeof target === 'object';
}






