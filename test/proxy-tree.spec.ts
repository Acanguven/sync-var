import {ProxyTree} from "../lib/proxy-tree";
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

    //Act
    const proxy = ProxyTree.construct(obj);

    //Assert
    expect(proxy).to.deep.eq(obj);
    expect(proxy).to.not.eq(obj);
  });

  it('should throw error if type is not object', function () {
    const wrap = () => {
      ProxyTree.wrap(5 as any, 'string');
    };

    const construct = () => {
      ProxyTree.construct(5 as any);
    };

    expect(wrap).to.throw();
    expect(construct).to.throw();
  });

  it('should traverse object and deeply generate proxies for inner objects', () => {
    //Arrange
    const obj = {
      a: faker.random.number(),
      b: {
        a: faker.random.number()
      }
    };
    const traversSpy = sandbox.spy(ProxyTree, 'traverseObject');
    const bindingSpy = sandbox.spy(ProxyTree, 'bindProxy');

    //Act
    const proxy = ProxyTree.construct(obj);

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
    const scope = {
      sharedObject: {
        a: faker.random.number(),
        b: faker.random.word()
      }
    };
    const preWrap = {...scope};
    const constructSpy = sandbox.spy(ProxyTree, 'construct');

    //Act
    ProxyTree.wrap(scope, 'sharedObject');

    //Assert
    expect(scope).to.deep.eq(preWrap);
    expect(constructSpy.calledWithExactly(scope.sharedObject)).to.eq(true);
  });

  it('should track changes on tree for primitive types', function () {
    //Arrange
    const newValue = faker.random.number();
    const scope = {
      sharedObject: {
        a: faker.random.number(),
      }
    };

    //Act
    ProxyTree.wrap(scope, 'sharedObject');
    scope.sharedObject.a = newValue;
    //Assert

    expect(scope.sharedObject.a).to.eq(newValue);
  });

  it('should traverse for new value if it is object', function () {
    //Arrange
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
    ProxyTree.wrap(scope, 'sharedObject');
    scope.sharedObject.a = newValue;
    //Assert

    expect(scope.sharedObject.a).to.deep.eq(newValue);
    expect(traverseSpy.calledWithExactly(newValue)).to.eq(true);
  });
});