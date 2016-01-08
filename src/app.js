import {run} from '@cycle/core';
import CycleDOM from '@cycle/dom';
import {Observable} from 'rx';
import storageDriver from '@cycle/storage';
// THE MAIN FUNCTION
// This is the todo list component.
import Todos from './components/Todos/index';

const main = Todos;

// THE ENTRY POINT
// This is where the whole story starts.
// `run` receives a main function and an object with
// the source streams.
run(main, {
  // THE DOM DRIVER
  // We create a DOM driver by passing
  // a DOM selector to the `makeDOMDriver` function.
  DOM: CycleDOM.makeDOMDriver('.todoapp'),
  // THE INITAL HASH STREAM
  // A stream that only delivers the initial hash value.
  initialHash: () => Observable.just(window.location.hash),
  // THE HASH CHANGE STREAM
  // A stream that delivers the hash value on the hashChange event.
  hashchange: () => Observable.fromEvent(window, 'hashchange'),
  // THE STORAGE DRIVER
  // The storage driver which can be used to access values for
  // local- and sessionStorage keys as streams.
  storage: storageDriver
});
