/* eslint-disable no-undef */
importScripts("decimal.js");
self.addEventListener("message", function (event) {
    // Access the data sent from the main thread
    const theNumber = event.data.integer;
    const result = doComputation(theNumber);
    // Send the result back to the main thread
    self.postMessage({
        result : result,
        key : event.data.key
    });
});

function doComputation (data) {
    let int = new Decimal(data);
    let squareRoot = int.squareRoot();
    let max = squareRoot.ceil().plus(new Decimal(1));
    let i = new Decimal(2);
    while (i.lessThan(max)) {
        let test = int.modulo(i).equals(0);
        if (test) {
            return i.toString();
        }
        i = i.add(1);
    }
    return int.toString();
}