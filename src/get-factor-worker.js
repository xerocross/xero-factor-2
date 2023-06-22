
import FactorRequestHandler from "./FactorRequestHandler.js";
const factorRequestHandler = new FactorRequestHandler();
self.addEventListener("message", function (event) {
    factorRequestHandler.post(event)
        .then((resultEvent) => {
            self.postMessage(resultEvent);
        })
        .catch((e) => {
            self.postMessage({
                status : "error",
                payload : {
                    "error" : e,
                    "integer" : event.data.payload.integer
                }
            });
        });
});



