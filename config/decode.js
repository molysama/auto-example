import setting from "./setting.json"

const KEY = new $crypto.Key(setting.KEY)
const TYPE = "AES/ECB/PKCS7padding"

const source = $crypto.decrypt(
    files.read("dist/" + setting.TARGET),
    KEY,
    TYPE,
    {
        output: "string",
    }
)
engines.execScript(source)
