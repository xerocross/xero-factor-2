
import handleFactorRequest from "./workerScript.js";
self.addEventListener("message", function (event) {
    handleFactorRequest(event);
});



