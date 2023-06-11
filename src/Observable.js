// subscribeFunction is a function of the
// form (observer) => {here define and start
// the activities of this observer upon
// subscribing }
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
    }
};
export { Observable };