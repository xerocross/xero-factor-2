function Observable (subscribeFunction) {
    const self = this;
    let subscriberUpdateFunction = function () {};
    const observer = {
        next : (val) => {
            subscriberUpdateFunction(val);
        }
    };
    this.subscribe = (subFunction) => {
        subscriberUpdateFunction = subFunction;
        subscribeFunction(observer);
    };
};
export { Observable };