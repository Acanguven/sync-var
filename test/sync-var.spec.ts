import {SyncVar} from "../lib/sync-var";
import {expect} from "chai";

describe('SyncVar', () => {
  it('should export class SyncVar', () => {
    //Assert
    expect(SyncVar).to.be.a('function');
  });

  it('should has a method for connecting object to remote host', () => {
    //Arrange
    const remoteObject = SyncVar.connect()

    //Act

    //Assert

  });
});
