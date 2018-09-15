import {ProxyTree, ProxyTreeChangeTypes} from "../lib/proxy-tree";
import {expect} from "chai";
import faker from "faker";
import sinon from "sinon";

let sandbox: sinon.SinonSandbox;

describe('ProxyTree', () => {
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return new proxy tree for object', () => {
    //Arrange
    const obj = {};
    const spy = sandbox.spy();

    //Act
    const proxy = ProxyTree.construct(obj, spy);

    //Assert
    expect(proxy).to.deep.eq(obj);
    expect(proxy).to.not.eq(obj);
  });

  it('should throw error if type is not object', function () {
    const spy = sandbox.spy();

    const wrap = () => {
      ProxyTree.wrap(5 as any, 'string', spy);
    };

    const construct = () => {
      ProxyTree.construct(5 as any, spy);
    };

    expect(wrap).to.throw();
    expect(construct).to.throw();
  });

  it('should traverse object and deeply generate proxies for inner objects', () => {
    //Arrange
    const spy = sandbox.spy();
    const obj = {
      a: faker.random.number(),
      b: {
        a: faker.random.number()
      }
    };
    const traversSpy = sandbox.spy(ProxyTree, 'traverseObject');
    const bindingSpy = sandbox.spy(ProxyTree, 'bindProxy');

    //Act
    const proxy = ProxyTree.construct(obj, spy);

    //Assert
    expect(proxy).to.deep.eq(obj);
    expect(proxy).to.not.eq(obj);
    expect(proxy.a).to.eq(obj.a);
    expect(proxy.b).to.not.eq(obj.b);
    expect(proxy.b).to.deep.eq(obj.b);

    expect(traversSpy.calledWithExactly(obj.b));
    expect(bindingSpy.calledWithExactly(obj.b));
  });

  it('should wrap existing object with ProxyTree', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {
        a: faker.random.number(),
        b: faker.random.word()
      }
    };
    const preWrap = {...scope};
    const constructSpy = sandbox.spy(ProxyTree, 'construct');

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);

    //Assert
    expect(scope).to.deep.eq(preWrap);
    expect(constructSpy.calledWithExactly(scope.sharedObject, spy)).to.eq(true);
  });

  it('should track changes on tree for primitive types', function () {
    //Arrange
    const spy = sandbox.spy();
    const newValue = faker.random.number();
    const scope = {
      sharedObject: {
        a: faker.random.number(),
      }
    };

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    scope.sharedObject.a = newValue;
    //Assert

    expect(scope.sharedObject.a).to.eq(newValue);
  });

  it('should traverse for new value if it is object', function () {
    //Arrange
    const spy = sandbox.spy();
    const newValue = {
      c: faker.random.number()
    };
    const scope = {
      sharedObject: {
        a: faker.random.number(),
      }
    } as any;
    const traverseSpy = sandbox.spy(ProxyTree, 'traverseObject');

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    scope.sharedObject.a = newValue;

    //Assert

    expect(scope.sharedObject.a).to.deep.eq(newValue);
    expect(traverseSpy.calledWithExactly(newValue, spy, `${ProxyTree.PROXY_ROOT}.a`)).to.eq(true);
  });

  it('should call set callback on change', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {
        a: 34,
        b: {
          c: 44
        }
      }
    } as any;

    // Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    scope.sharedObject.a = 44;
    scope.sharedObject.b.c = {
      z: 3
    };
    scope.sharedObject.b.c.z = 44;

    //Assert
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.a`, ProxyTreeChangeTypes.SET, 44));
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.b.c`, ProxyTreeChangeTypes.SET, {z: 3}));
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.b.c.z`, ProxyTreeChangeTypes.SET, 44));
    expect(scope.sharedObject.a).to.eq(44);
    expect(scope.sharedObject.b.c.z).to.eq(44);
  });

  it('should not fire callback if set failed', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {}
    } as any;

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    const test = () => {
      Object.defineProperty(scope.sharedObject, 'a', {value: 1, writable: false});
      scope.sharedObject.a = 44;
    };

    //Assert
    expect(test).to.throw();
    expect(scope.sharedObject.a).to.eq(1);
    expect(spy.neverCalledWith(`${ProxyTree.PROXY_ROOT}.a`, ProxyTreeChangeTypes.SET, 44));
  });

  it('should call delete callback on delete', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {
        a: 34,
        b: {
          c: 44
        }
      }
    } as any;

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    delete scope.sharedObject.a;
    delete scope.sharedObject.b.c;
    delete scope.sharedObject.b;

    //Assert
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.a`, ProxyTreeChangeTypes.DELETE));
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.b.c`, ProxyTreeChangeTypes.DELETE));
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.b`, ProxyTreeChangeTypes.DELETE));
    expect(scope.sharedObject).to.deep.eq({})
  });

  it('should not fire delete callbabck when it fails to delete property', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {}
    } as any;

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    const test = () => {
      Object.defineProperty(scope.sharedObject, 'a', {value: 1, writable: false});
      delete scope.sharedObject.a;
    };

    //Assert
    expect(test).to.throw();
    expect(scope.sharedObject.a).to.eq(1);
    expect(spy.neverCalledWith(`${ProxyTree.PROXY_ROOT}.a`, ProxyTreeChangeTypes.DELETE));
  });

  it('should call define property callback when new property generated with Description', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {}
    } as any;

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    Object.defineProperty(scope.sharedObject, 'c', {value: {z: 22}, writable: true});
    Object.defineProperty(scope.sharedObject.c, 'd', {value: 44});

    //Assert
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.c`, ProxyTreeChangeTypes.DEFINE_PROPERTY, {z: 22}, {}));
    expect(spy.calledWithExactly(`${ProxyTree.PROXY_ROOT}.c.d`, ProxyTreeChangeTypes.DEFINE_PROPERTY, 44, {}));
    expect(scope.sharedObject.c).to.deep.eq({z: 22});
    expect(scope.sharedObject.c.d).to.eq(44);
  });

  it('should not call define property callbback when it fails to define property', () => {
    //Arrange
    const spy = sandbox.spy();
    const scope = {
      sharedObject: {}
    } as any;

    //Act
    ProxyTree.wrap(scope, 'sharedObject', spy);
    const test = () => {
      Object.defineProperty(scope.sharedObject, 'a', {value: 1, writable: false});
      Object.defineProperty(scope.sharedObject, 'a', {value: 44});
    };

    //Assert
    expect(test).to.throw();
    expect(scope.sharedObject.a).to.eq(1);
    expect(spy.neverCalledWith(`${ProxyTree.PROXY_ROOT}.a`, ProxyTreeChangeTypes.DEFINE_PROPERTY, 44, {}));
  });
});
