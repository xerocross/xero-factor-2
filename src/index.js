import "./assets/main.css";

import { createApp } from "vue";
import XeroFactor2 from "./components/XeroFactor2.vue";

const myWorker = new Worker("js/get-factor-worker.js");

try {
    createApp(XeroFactor2, {
        worker : myWorker
    })
        .mount("#xero-factor-2");
}
catch(e) {
    console.log("mounting error", e);
}