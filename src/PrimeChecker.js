import Decimal from "decimal.js";

// num should be a Decimal from decimal.js
export default function isPrime (num) {
    if (!num.floor().equals(num)) {
        // num is not an integer
        return false;
    }
    if (num.greaterThan(new Decimal(1))) {
        // input must be a natural number greater than 1
        // by definition 1 is not prime
        return false;
    }

    let max = num.squareRoot().ceil() + new Decimal(1);
    for (let i = 2; i.lessThan(max); i++) {
        if (num.modulo(i).equals(0)) {
            return false;
        }
    }
    return true;
};