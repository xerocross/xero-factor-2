import "./assets/main.css";
import { createApp } from "vue";
import XeroFactor2 from "./components/XeroFactor2.vue";
import queryString from "query-string";


const locationQueryString = window.location.search;
const queryObject = queryString.parse(locationQueryString);

try {
    let myWorker;
    if (typeof Worker === "function") {
        myWorker = new Worker(new URL("./get-factor-worker.js", import.meta.url), {
            type : "module"
        });
    }
    createApp(XeroFactor2, {
        worker : myWorker,
        queryObject : queryObject
    }).mount("#xero-factor-2");
    
}
catch(e) {
    console.log("mounting error", e);
    throw e;
}