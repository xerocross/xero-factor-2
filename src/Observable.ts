// subscribeFunction is a function of the
// form (observer) => {here define and start
// the activities of this observer upon
// subscribing }
// this is a constructor; should be
// called with new to create new Obsesrvable
// object

// type ObservableEvent = {
//     status : string,
//     payload ?: any
// }

// type Observer = {
//     next : (event : ObservableEvent) => void
// }
// type Subscriber = { 
//     cancel : () => void, 
//     observable : Observable | null
// };
import { ObservableEvent } from "./Observable.d";

class Observable {
    private subscriberUpdateFunction : (arg : any) => void = function () {};
    private subscribeFunction;

    constructor (subscribeFunction) {
        this.subscribeFunction = subscribeFunction;
    }

    private observer = {
        next : (event : ObservableEvent) => {
            this.subscriberUpdateFunction(event);
        }
    };
    // a holder of the observable object
    // can call subscribe with an argument
    // of the form subFunction : (event) => 
    // {...instructions
    // on what to do with incoming events; 
    // }. 
    subscribe = (subFunction) => {
        this.subscriberUpdateFunction = subFunction;
        this.subscribeFunction(this.observer);
    };

    cancel = () => {
        this.subscriberUpdateFunction = () => {};
    };
}
export { Observable };