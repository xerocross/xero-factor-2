/* eslint-disable no-undef */
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static("dist"));
app.use("/dist", express.static("dist"));
app.listen(port, () => console.log(`Xero-Factor-2 listening on port ${port}!`));