import { ObservableAction, SubscribeFunction, Observer, ObservableEvent, Subscriber } from "./Observable.d";

class Observable {
    private subscribeFunction : SubscribeFunction;
    private observableAction : ObservableAction;
    private isCancelled = false;

    constructor (observableAction : ObservableAction ) {
        this.observableAction = observableAction;
        this.subscribeFunction = () => {};
    }

    private getSubscribeFunction () {
        return this.subscribeFunction;
    }

    private getObserver () : Observer { 
        return {
            next : (event : ObservableEvent) => {
                this.getSubscribeFunction()(event);
            }
        };
    }

    public subscribe = (subscribeFunction : SubscribeFunction) : Subscriber => {
        this.subscribeFunction = subscribeFunction;
        this.observableAction(this.getObserver(), () => this.isCancelled);
        return {
            cancel : this.cancel,
            observable : this
        };
    };

    public cancel () {
        this.subscribeFunction = () => {};
        this.isCancelled = true;
    }
}
export default Observable;