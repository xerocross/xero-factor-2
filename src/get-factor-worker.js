
import FactorRequestHandler from "./FactorRequestHandler";
const factorRequestHandler = new FactorRequestHandler();
self.addEventListener("message", function (event) {
    factorRequestHandler.post(event.data)
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



