// export const DEFAULT_POLLING_INTERVAL = 3000;
//
// export interface IPollingHandler {
//   pollingInterval: number;
//
//   onRequest: () => void;
//
//   polling: () => void;
//
//   onChange: (obj: object, path: string[], value: any) => void;
// }
//
// export class PollingHandler implements IPollingHandler {
//   pollingInterval: number;
//
//   constructor(pollingInterval: number = DEFAULT_POLLING_INTERVAL) {
//     this.pollingInterval = pollingInterval;
//   }
//
//   onRequest() {
//     throw new Error('Invoked abstract method, implement method onRequest');
//   }
//
//   polling() {
//     throw new Error('Invoked abstract method, implement method polling');
//   }
//
//   onChange(obj: object, path: string[], value: any) {
//
//   }
// }
//
// export class HttpPolling extends PollingHandler {
//   constructor(pollingInterval?: number) {
//     super(pollingInterval);
//   }
//
//   onRequest() {
//
//   }
//
//   polling() {
//
//   }
//
//   onChange(obj: object, path: string[], value: any) {
//
//   }
// }
//
// const syncVar = require('syncVar');
// syncvar.bind('name', variable);
// syncvar.bind('name', scope, variable);
//
// syncedVariable = syncvar.connect({
//   host: '',
//   name: '',
//   method: ''
// });
