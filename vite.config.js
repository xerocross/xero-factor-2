import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import workerPlugin from "worker-plugin";

// https://vitejs.dev/config/
export default defineConfig({
    plugins : [vue(),  workerPlugin()],
    resolve : {
        alias : {
            "@" : fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    build : {
        worker : {
            entry : "src/get-factor-worker.js",
            output : "/"
        }
    }
});
