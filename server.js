import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(json());

if (!fs.existsSync("public")) {
  fs.mkdirSync("public");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      cb(new Error("Only image files are allowed!"), false);
    } else {
      cb(null, true);
    }
  },
}).single("image");

let filePath;

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      res.status(400).json({ error: err.message });
    } else if (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message || "Error uploading file" });
    } else if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
    } else {
      filePath = req.file.path;
      res.status(200).json({
        message: "File uploaded successfully",
        filePath,
      });
    }
  });
});

app.get("/", (req, res) => res.send("Hello, World!"));

app.post("/gemini", async (req, res) => {
  try {
    function fileToGenerativePath(path, mimeType) {
      return {
        inlineData: {
          data: Buffer.from(fs.readFileSync(path)).toString("base64"),
          mimeType,
        },
      };
    }
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const prompt = req.body.message;
    const result = await model.generateContent([
      prompt,
      fileToGenerativePath(filePath, "image/jpeg"),
    ]);
    const response = await result.response;
    const text = response.text();
    res.send(text);
  } catch (err) {
    console.error("Error generating content:", err);
  }
});

app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

const port = 8001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`CORS enabled for origin: http://localhost:5173`);
});
