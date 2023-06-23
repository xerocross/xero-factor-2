import FactorRequestHandler from "../src/FactorRequestHandler.js";

it("returns that the first factor of 15 is 3", (done) => {
    let factorRequestHandler = new FactorRequestHandler();
    factorRequestHandler.post({
        data : {
            status : "factor",
            payload : {
                integer : "15",
                quotient : "15",
                lastFactor : ""
            }
        }
    }).then((result) => {
        expect(result.payload.factor).toBe("3");
        done();
    });
});
it("returns that the first factor of 7 is 7", (done) => {
    let factorRequestHandler = new FactorRequestHandler();
    factorRequestHandler.post({
        data : {
            status : "factor",
            payload : {
                integer : "7",
                quotient : "7",
                lastFactor : ""
            }
        }
    }).then((result) => {
        expect(result.payload.factor).toBe("7");
        done();
    });
});
it("returns successful halt on halt request", (done) => {
    let factorRequestHandler = new FactorRequestHandler();
    factorRequestHandler.post({
        data : {
            status : "factor",
            payload : {
                integer : "58971478991679167",
                quotient : "58971478991679167",
                lastFactor : ""
            }
        }
    }).then((result) => {
        expect(result.status).toBe("halted");
        done();
    });
    factorRequestHandler.post({
        data : {
            status : "halt",
            payload : {
                integer : "58971478991679167",
                quotient : "",
                lastFactor : ""
            }
        }
    });
});