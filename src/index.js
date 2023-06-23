import "./assets/main.css";
import { createApp } from "vue";
import XeroFactor2 from "./components/XeroFactor2.vue";

try {
    let myWorker;
    if (typeof Worker === "function") {
        myWorker = new Worker(new URL("./get-factor-worker.js", import.meta.url), {
            type : "module"
        });
    }
    createApp(XeroFactor2, {
        worker : myWorker
    }).mount("#xero-factor-2");
    
}
catch(e) {
    console.log("mounting error", e);
    throw e;
}