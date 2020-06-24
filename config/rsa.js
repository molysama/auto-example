const setting = require("./setting.json")

const CryptoJS = require("crypto-js")
const fs = require("fs")

console.time("Encrypt")

var file = fs.readFileSync("dist/index.js", "utf8")

var encrypted = CryptoJS.AES.encrypt(file, setting.KEY, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
}).toString()

fs.writeFileSync("dist/" + setting.TARGET, encrypted)

console.timeEnd("Encrypt")
