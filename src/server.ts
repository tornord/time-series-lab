import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";

const dataFolder = "data/ms";

var app = express();
app.use(cors());

app.get("/", async (req, res) => {
  const { insrefs } = req.query;
  if (!insrefs) {
    res.status(500).send();
    return;
  }
  const m = (insrefs as string).match(/^[0-9,]+$/);
  if (!m) {
    res.status(500).send();
    return;
  }
  try {
    const insrefsArray = (insrefs as string).split(",");
    const resArray = [];
    for (let i = 0; i < insrefsArray.length; i++) {
      const insref = insrefsArray[i];
      const fn = path.join(__dirname, dataFolder, `${insref}.json`);
      const hist = JSON.parse(fs.readFileSync(fn, "utf-8"));
      resArray.push(hist);
    }
    res.send(resArray);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

app.listen(3001);
