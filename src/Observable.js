// subscribeFunction is a function of the
// form (observer) => {here define and start
// the activities of this observer upon
// subscribing }
// this is a constructor; should be
// called with new to create new Obsesrvable
// object
function Observable (subscribeFunction) {
    let subscriberUpdateFunction = function () {};
    const observer = {
        next : (val) => {
            subscriberUpdateFunction(val);
        }
    };
    // a holder of the observable object
    // can call subscribe with an argument
    // of the form subFunction : (event) => 
    // {...instructions
    // on what to do with incoming events; 
    // }. 
    this.subscribe = (subFunction) => {
        subscriberUpdateFunction = subFunction;
        subscribeFunction(observer);
    };

    this.cancel = () => {
        subscriberUpdateFunction = () => {};
    };
}
export { Observable };