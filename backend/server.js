const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")

const app = express()
const PORT = 5000
const paintingsDir = path.join(__dirname, "paintings")

if (!fs.existsSync(paintingsDir)) {
  fs.mkdirSync(paintingsDir, { recursive: true })
}

app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use("/paintings", express.static(paintingsDir))

const getPaintingList = () => {
  return fs
    .readdirSync(paintingsDir)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .sort((a, b) => {
      const aTime = fs.statSync(path.join(paintingsDir, a)).mtimeMs
      const bTime = fs.statSync(path.join(paintingsDir, b)).mtimeMs
      return bTime - aTime
    })
    .map((file) => ({
      name: file,
      url: `http://localhost:${PORT}/paintings/${file}`
    }))
}

app.get("/api/paintings", (req, res) => {
  res.json(getPaintingList())
})

app.post("/api/paintings", (req, res) => {
  const { image } = req.body

  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ message: "Invalid image data." })
  }

  const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)

  if (!matches) {
    return res.status(400).json({ message: "Invalid image format." })
  }

  const extension = matches[1] === "jpeg" ? "jpg" : matches[1]
  const base64Data = matches[2]
  const fileName = `painting-${Date.now()}.${extension}`
  const filePath = path.join(paintingsDir, fileName)

  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"))

  res.status(201).json({
    message: "Painting saved successfully.",
    painting: {
      name: fileName,
      url: `http://localhost:${PORT}/paintings/${fileName}`
    },
    paintings: getPaintingList()
  })
})

app.delete("/api/paintings/:name", (req, res) => {
  const fileName = path.basename(req.params.name)
  const filePath = path.join(paintingsDir, fileName)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Painting not found." })
  }

  fs.unlinkSync(filePath)

  res.json({
    message: "Painting deleted successfully.",
    paintings: getPaintingList()
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})