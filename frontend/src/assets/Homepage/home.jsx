"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const API_URL = "http://localhost:5000/api"

export default function Home() {
  const [theme, setTheme] = useState("pink")
  const [bookPage, setBookPage] = useState(0)
  const [flipDirection, setFlipDirection] = useState("next")
  const [isFlipping, setIsFlipping] = useState(false)
  const [selectedColor, setSelectedColor] = useState("#ff4fa3")
  const [brushSize, setBrushSize] = useState(8)
  const [eraserSize, setEraserSize] = useState(24)
  const [tool, setTool] = useState("brush")
  const [savedPaintings, setSavedPaintings] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef({ x: 0, y: 0 })
  const historyRef = useRef([])
  const redoRef = useRef([])

  const decorations = [
    { src: "/cloud.png", alt: "Cloud", className: "absolute left-[6%] top-[10%] h-20 w-20 opacity-90 object-contain sm:h-24 sm:w-24 animate-float" },
    { src: "/cloud.png", alt: "Cloud", className: "absolute right-[8%] top-[12%] h-24 w-24 opacity-90 object-contain sm:h-28 sm:w-28 animate-float-delayed" },
    { src: "/balloon.png", alt: "Balloon", className: "absolute left-[12%] top-[26%] h-18 w-18 opacity-80 object-contain sm:h-20 sm:w-20 animate-float-slow" },
    { src: "/balloon.png", alt: "Balloon", className: "absolute right-[14%] top-[24%] h-18 w-18 opacity-80 object-contain sm:h-20 sm:w-20 animate-float" },
    { src: "/flower.png", alt: "Flower", className: "absolute left-[10%] bottom-[22%] h-20 w-20 opacity-80 object-contain sm:h-24 sm:w-24 animate-float-delayed" },
    { src: "/present.png", alt: "Present", className: "absolute right-[10%] bottom-[20%] h-20 w-20 opacity-80 object-contain sm:h-24 sm:w-24 animate-float-slow" },
    { src: "/star.png", alt: "Star", className: "absolute left-[18%] bottom-[14%] h-18 w-18 opacity-80 object-contain sm:h-20 sm:w-20 animate-float" },
    { src: "/heart.png", alt: "Heart", className: "absolute right-[18%] bottom-[12%] h-18 w-18 opacity-80 object-contain sm:h-20 sm:w-20 animate-float-delayed" }
  ]

  const photoBookPages = [
    [
      { src: "/aqui.png", alt: "Baby Aqui photo 1" },
      { src: "/aqui1.jpg", alt: "Baby Aqui photo 2" }
    ],
    [
      { src: "/aqui2.jpg", alt: "Baby Aqui photo 3" },
      { src: "/aqui 3.jpg", alt: "Baby Aqui photo 4" }
    ]
  ]

  const colorOptions = useMemo(
    () => ["#ff4fa3", "#ff7aa8", "#ffb703", "#ff6b6b", "#7c3aed", "#3b82f6", "#10b981", "#111827", "#ffffff"],
    []
  )

  const isPink = theme === "pink"

  const getCanvasContext = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext("2d")
  }

  const fillCanvasWhite = () => {
    const canvas = canvasRef.current
    const ctx = getCanvasContext()
    if (!canvas || !ctx) return
    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  const saveHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    historyRef.current.push(canvas.toDataURL("image/png"))
    if (historyRef.current.length > 60) {
      historyRef.current.shift()
    }
  }

  const restoreFromDataUrl = (dataUrl) => {
    const canvas = canvasRef.current
    const ctx = getCanvasContext()
    if (!canvas || !ctx || !dataUrl) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = dataUrl
  }

  const initializeCanvas = () => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const width = Math.max(900, Math.floor(rect.width))
    const height = 520

    canvas.width = width
    canvas.height = height
    canvas.style.width = "100%"
    canvas.style.height = `${height}px`

    fillCanvasWhite()
    historyRef.current = [canvas.toDataURL("image/png")]
    redoRef.current = []
  }

  const fetchPaintings = async () => {
    try {
      const res = await fetch(`${API_URL}/paintings`)
      const data = await res.json()
      setSavedPaintings(Array.isArray(data) ? data : [])
    } catch {
      setSavedPaintings([])
    }
  }

  useEffect(() => {
    initializeCanvas()
    fetchPaintings()

    const handleResize = () => {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return
      const snapshot = currentCanvas.toDataURL("image/png")
      initializeCanvas()
      restoreFromDataUrl(snapshot)
      historyRef.current = [canvasRef.current.toDataURL("image/png")]
      redoRef.current = []
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const changePage = (direction) => {
    if (isFlipping) return
    setFlipDirection(direction)
    setIsFlipping(true)

    setTimeout(() => {
      setBookPage((prev) =>
        direction === "next"
          ? prev === photoBookPages.length - 1
            ? 0
            : prev + 1
          : prev === 0
            ? photoBookPages.length - 1
            : prev - 1
      )
    }, 260)

    setTimeout(() => {
      setIsFlipping(false)
    }, 900)
  }

  const getPoint = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX
    const clientY = "touches" in event ? event.touches[0].clientY : event.clientY

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    }
  }

  const startDrawing = (event) => {
    event.preventDefault()
    const ctx = getCanvasContext()
    if (!ctx) return

    drawingRef.current = true
    const point = getPoint(event)
    lastPointRef.current = point

    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event) => {
    event.preventDefault()
    if (!drawingRef.current) return

    const ctx = getCanvasContext()
    if (!ctx) return

    const point = getPoint(event)

    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = tool === "eraser" ? eraserSize : brushSize
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over"
    ctx.strokeStyle = selectedColor

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    lastPointRef.current = point
  }

  const stopDrawing = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    saveHistory()
    redoRef.current = []
  }

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return
    const current = historyRef.current.pop()
    redoRef.current.push(current)
    const previous = historyRef.current[historyRef.current.length - 1]
    restoreFromDataUrl(previous)
  }

  const handleRedo = () => {
    if (!redoRef.current.length) return
    const next = redoRef.current.pop()
    historyRef.current.push(next)
    restoreFromDataUrl(next)
  }

  const handleClearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = getCanvasContext()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    fillCanvasWhite()
    saveHistory()
    redoRef.current = []
  }

  const handleSavePainting = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsSaving(true)

    try {
      const image = canvas.toDataURL("image/png")
      const res = await fetch(`${API_URL}/paintings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image })
      })

      const data = await res.json()
      if (Array.isArray(data.paintings)) {
        setSavedPaintings(data.paintings)
      } else {
        fetchPaintings()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSavedPainting = async (name) => {
    try {
      const res = await fetch(`${API_URL}/paintings/${encodeURIComponent(name)}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (Array.isArray(data.paintings)) {
        setSavedPaintings(data.paintings)
      } else {
        fetchPaintings()
      }
    } catch {}
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isPink
          ? "bg-linear-to-b from-pink-100 via-rose-50 to-fuchsia-100"
          : "bg-linear-to-b from-sky-100 via-cyan-50 to-blue-100"
      }`}
    >
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes pageTurnNext {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-160deg);
          }
        }
        @keyframes pageTurnPrev {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(160deg);
          }
        }
        @keyframes pageReveal {
          0% {
            opacity: 0.65;
            transform: scale(0.985);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 5s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 6s ease-in-out infinite;
        }
        .page-reveal {
          animation: pageReveal 0.45s ease;
        }
        .page-turn-next {
          animation: pageTurnNext 0.8s ease-in-out forwards;
          transform-origin: left center;
        }
        .page-turn-prev {
          animation: pageTurnPrev 0.8s ease-in-out forwards;
          transform-origin: right center;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>

      <div className="absolute right-5 top-5 z-20 flex items-center gap-3 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur">
        <button
          onClick={() => setTheme("pink")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            isPink
              ? "bg-linear-to-r from-pink-400 via-rose-400 to-fuchsia-400 text-white shadow-md"
              : "bg-pink-100 text-pink-500"
          }`}
        >
          Pink Theme
        </button>
        <button
          onClick={() => setTheme("blue")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            !isPink
              ? "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400 text-white shadow-md"
              : "bg-blue-100 text-blue-500"
          }`}
        >
          Blue Theme
        </button>
      </div>

      <div className="absolute inset-0">
        <div
          className={`absolute -left-16 top-10 h-52 w-52 rounded-full blur-3xl ${
            isPink ? "bg-pink-200/70" : "bg-sky-200/70"
          }`}
        ></div>
        <div
          className={`absolute right-0 top-0 h-72 w-72 rounded-full blur-3xl ${
            isPink ? "bg-rose-200/60" : "bg-cyan-200/60"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-1/4 h-64 w-64 rounded-full blur-3xl ${
            isPink ? "bg-fuchsia-200/50" : "bg-blue-200/50"
          }`}
        ></div>
        <div
          className={`absolute bottom-10 right-10 h-44 w-44 rounded-full blur-3xl ${
            isPink ? "bg-pink-300/40" : "bg-sky-300/40"
          }`}
        ></div>

        {decorations.map((item, index) => (
          <img
            key={index}
            src={item.src}
            alt={item.alt}
            className={item.className}
          />
        ))}
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative w-full max-w-5xl">
          <div
            className={`absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl ${
              isPink ? "bg-pink-200" : "bg-sky-200"
            }`}
          ></div>

          <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
            <div
              className={`absolute h-36 w-36 rounded-full shadow-[0_20px_60px_rgba(244,114,182,0.35)] ${
                isPink
                  ? "bg-linear-to-br from-pink-300 via-rose-300 to-fuchsia-300"
                  : "bg-linear-to-br from-sky-300 via-cyan-300 to-blue-300"
              }`}
            ></div>
            <img
              src="/aqui.png"
              alt="Birthday celebrant"
              className="relative h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>

          <div className="mx-auto max-w-4xl">
            <p
              className={`mb-4 text-sm font-bold uppercase tracking-[0.4em] ${
                isPink ? "text-pink-500" : "text-sky-500"
              }`}
            >
              2nd Birthday Celebration
            </p>

            <h1
              className={`text-5xl font-extrabold leading-none sm:text-6xl md:text-7xl ${
                isPink ? "text-rose-500" : "text-blue-500"
              }`}
            >
              Happy
              <span
                className={`mx-2 inline-block rotate-[-4deg] ${
                  isPink ? "text-pink-400" : "text-cyan-400"
                }`}
              >
                2nd
              </span>
              Birthday
            </h1>

            <h2
              className={`mt-3 text-3xl font-extrabold sm:text-4xl md:text-5xl ${
                isPink ? "text-fuchsia-400" : "text-sky-400"
              }`}
            >
              Baby Aqui
            </h2>

            <p
              className={`mx-auto mt-8 max-w-3xl text-lg leading-9 md:text-xl ${
                isPink ? "text-rose-700" : "text-blue-700"
              }`}
            >
              Hello baby Aqui, Happy Birthday to you! I know that hindi mo pa to mareread kasi baby pa ikaw, ang wish ko para sayo is that sana maging healthy always, mabait, masayahin, matalino, at mag grow ikaw na may respect sa mga tao, specially sa mommy Aila mo okay? wag ikaw masyado mag pasaway sa mommy mo okay? Lagi mo mahalin mommy mo ha. Sana maging masaya lagi ang birthday mo, and sana maging masaya lagi ang life mo. Happy 2nd Birthday!
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-4xl sm:text-5xl">
              <span className="animate-bounce">🎂</span>
              <span className="animate-pulse">🎀</span>
              <span className="animate-bounce [animation-delay:200ms]">🧸</span>
              <span className="animate-pulse [animation-delay:300ms]">🌸</span>
              <span className="animate-bounce [animation-delay:400ms]">✨</span>
            </div>

            <div className="relative mx-auto mt-14 max-w-3xl">
              <div className="absolute left-1/2 top-1/2 h-56 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl"></div>

              <div className="relative">
                <div
                  className={`mx-auto mb-5 flex flex-wrap items-center justify-center gap-4 text-base font-bold ${
                    isPink ? "text-pink-600" : "text-blue-600"
                  }`}
                >
                  <span className="rounded-full bg-white/70 px-5 py-3 shadow-[0_10px_30px_rgba(255,182,193,0.35)]">
                    BIRTHDAY SONG FOR BABY AQUI
                  </span>
                </div>

                <div className="mx-auto mb-8 max-w-3xl overflow-hidden rounded-4xlrder-4 border-white/80 bg-white/60 p-3 shadow-[0_20px_60px_rgba(244,114,182,0.25)] backdrop-blur">
                  <video
                    className="h-full w-full rounded-3xlct-cover shadow-lg"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/bdaysong.mp4" type="video/mp4" />
                  </video>
                </div>

                <div
                  className={`mx-auto max-w-2xl rounded-[999px] px-8 py-6 shadow-[0_20px_60px_rgba(244,114,182,0.35)] ${
                    isPink
                      ? "bg-linear-to-r from-pink-300 via-rose-300 to-fuchsia-300"
                      : "bg-linear-to-r from-sky-300 via-cyan-300 to-blue-300"
                  }`}
                >
                  <p className="text-xl font-extrabold text-white sm:text-2xl md:text-3xl">
                    Wishin' baby Aqui have a healthy and happy birthday! 🎀
                  </p>
                </div>

                <div className="mx-auto mt-10 max-w-5xl">
                  <div className="mb-5 flex items-center justify-center">
                    <span
                      className={`rounded-full px-5 py-3 text-sm font-bold tracking-[0.25em] ${
                        isPink
                          ? "bg-white/80 text-pink-500"
                          : "bg-white/80 text-blue-500"
                      } shadow-lg`}
                    >
                      PHOTO BOOK
                    </span>
                  </div>

                  <div className="relative mx-auto w-full max-w-4xl px-2 sm:px-6">
                    <div
                      className={`relative rounded-[2.5rem] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.18)] ${
                        isPink
                          ? "bg-linear-to-br from-rose-300 via-pink-300 to-fuchsia-400"
                          : "bg-linear-to-brrom-sky-300 via-cyan-300 to-blue-400"
                      }`}
                    >
                      <div className="pointer-events-none absolute bottom-4 left-3 top-4 w-5 rounded-full bg-white/25 shadow-[inset_-6px_0_12px_rgba(255,255,255,0.25)] sm:left-5 sm:w-7"></div>
                      <div className="pointer-events-none absolute bottom-3 left-6 top-3 w-3 rounded-full bg-black/10 blur-sm sm:left-10 sm:w-4"></div>

                      <div className="relative overflow-hidden rounded-4xl bg-[#fffafc] p-4 sm:p-6">
                        <div className="pointer-events-none absolute inset-y-6 left-1/2 z-20 hidden w-0.5translate-x-1/2 bg-linear-to-brom-transparent via-rose-200/80 to-transparent md:block"></div>
                        <div className="pointer-events-none absolute inset-y-6 left-1/2 z-10 hidden w-8 -translate-x-1/2 rounded-full bg-black/5 blur-md md:block"></div>

                        <div className="relative hidden min-h-115 md:grid md:grid-cols-2">
                          <div className="relative z-10 flex h-full flex-col justify-between rounded-l-[1.75rem] bg-linear-to-brrom-white via-rose-50/70 to-white p-5 shadow-[inset_-12px_0_24px_rgba(0,0,0,0.06)]">
                            <div className="mb-4 flex items-center justify-between">
                              <span className={`text-xs font-bold uppercase tracking-[0.3em] ${isPink ? "text-pink-400" : "text-blue-400"}`}>
                                Memories
                              </span>
                              <span className={`text-sm font-bold ${isPink ? "text-pink-500" : "text-blue-500"}`}>
                                {bookPage * 2 + 1}
                              </span>
                            </div>

                            <div className="rounded-3xl bg-white p-3 shadow-[0_16px_35px_rgba(0,0,0,0.08)] -rotate-2">
                              <img
                                src={photoBookPages[bookPage][0].src}
                                alt={photoBookPages[bookPage][0].alt}
                                className="h-80 w-full rounded-2xl object-cover"
                              />
                            </div>

                            <p className={`mt-4 text-sm font-semibold ${isPink ? "text-rose-500" : "text-blue-500"}`}>
                              Sweet little moments with Baby Aqui
                            </p>
                          </div>

                          <div className="relative z-10 flex h-full flex-col justify-between rounded-r-[1.75rem] bg-linear-to-bl from-white via-rose-50/70 to-white p-5 shadow-[inset_12px_0_24px_rgba(0,0,0,0.06)]">
                            <div className="mb-4 flex items-center justify-between">
                              <span className={`text-xs font-bold uppercase tracking-[0.3em] ${isPink ? "text-pink-400" : "text-blue-400"}`}>
                                Precious
                              </span>
                              <span className={`text-sm font-bold ${isPink ? "text-pink-500" : "text-blue-500"}`}>
                                {bookPage * 2 + 2}
                              </span>
                            </div>

                            <div className="rounded-3xlhite p-3 shadow-[0_16px_35px_rgba(0,0,0,0.08)] rotate-2">
                              <img
                                src={photoBookPages[bookPage][1].src}
                                alt={photoBookPages[bookPage][1].alt}
                                className="h-80 w-full rounded-2xl object-cover"
                              />
                            </div>

                            <p className={`mt-4 text-sm font-semibold ${isPink ? "text-rose-500" : "text-blue-500"}`}>
                              A beautiful page from her growing journey
                            </p>
                          </div>

                          {isFlipping && (
                            <div className="pointer-events-none absolute inset-0 z-30 preserve-3d">
                              <div
                                className={`absolute top-0 h-full w-1/2 backface-hidden ${
                                  flipDirection === "next"
                                    ? "left-1/2 origin-left page-turn-next"
                                    : "left-0 origin-right page-turn-prev"
                                }`}
                              >
                                <div className="relative h-full w-full overflow-hidden bg-[#fffafc] shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
                                  <div className="absolute inset-0 bg-linear-to-br from-white via-rose-50 to-white"></div>
                                  <div className="absolute inset-y-0 left-0 w-10 bg-linear-to-rrom-black/10 to-transparent"></div>
                                  <div className="absolute inset-y-0 right-0 w-10 bg-linear-to-lrom-black/10 to-transparent"></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={`page-reveal md:hidden`}>
                          <div className="grid gap-4">
                            {photoBookPages[bookPage].map((photo, index) => (
                              <div
                                key={index}
                                className="rounded-[1.75rem] bg-white p-3 shadow-[0_16px_35px_rgba(0,0,0,0.08)]"
                              >
                                <img
                                  src={photo.src}
                                  alt={photo.alt}
                                  className="h-72 w-full rounded-[1.25rem] object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                      <button
                        onClick={() => changePage("prev")}
                        className={`rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 ${
                          isPink
                            ? "bg-linear-to-r from-pink-400 via-rose-400 to-fuchsia-400"
                            : "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400"
                        }`}
                      >
                        Previous Page
                      </button>

                      <div
                        className={`rounded-full bg-white/80 px-5 py-3 text-sm font-bold ${
                          isPink ? "text-pink-500" : "text-blue-500"
                        } shadow-md`}
                      >
                        Page {bookPage * 2 + 1}-{bookPage * 2 + 2} of 4
                      </div>

                      <button
                        onClick={() => changePage("next")}
                        className={`rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 ${
                          isPink
                            ? "bg-linear-to-r from-pink-400 via-rose-400 to-fuchsia-400"
                            : "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400"
                        }`}
                      >
                        Next Page
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-14 w-full max-w-6xl">
                  <div className="mb-5 flex items-center justify-center">
                    <span
                      className={`rounded-full px-5 py-3 text-sm font-bold tracking-[0.25em] ${
                        isPink ? "bg-white/80 text-pink-500" : "bg-white/80 text-blue-500"
                      } shadow-lg`}
                    >
                      PAINT WITH LOVE
                    </span>
                  </div>

                  <div
                    className={`rounded-[2.5rem] border-4 border-white/70 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur ${
                      isPink
                        ? "bg-linear-to-br from-white/80 via-rose-50/80 to-pink-100/80"
                        : "bg-linear-to-br from-white/80 via-cyan-50/80 to-sky-100/80"
                    }`}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-wrap items-center justify-center gap-3 rounded-4xl bg-white/75 p-4 shadow-md">
                        <button
                          onClick={() => setTool("brush")}
                          className={`rounded-full px-5 py-3 text-sm font-bold transition ${
                            tool === "brush"
                              ? isPink
                                ? "bg-linear-to-r from-pink-400 via-rose-400 to-fuchsia-400 text-white"
                                : "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          Brush
                        </button>

                        <button
                          onClick={() => setTool("eraser")}
                          className={`rounded-full px-5 py-3 text-sm font-bold transition ${
                            tool === "eraser"
                              ? isPink
                                ? "bg-linear-to-r from-pink-400 via-rose-400 to-fuchsia-400 text-white"
                                : "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          Eraser
                        </button>

                        <button
                          onClick={handleUndo}
                          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:scale-105"
                        >
                          Undo
                        </button>

                        <button
                          onClick={handleRedo}
                          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:scale-105"
                        >
                          Redo
                        </button>

                        <button
                          onClick={handleClearCanvas}
                          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:scale-105"
                        >
                          Delete Painting
                        </button>

                        <button
                          onClick={handleSavePainting}
                          disabled={isSaving}
                          className={`rounded-full px-5 py-3 text-sm font-bold text-white transition ${
                            isPink
                              ? "bg-linear-to-r from-pink-400 via-rose-400 to-fuchsia-400"
                              : "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400"
                          } ${isSaving ? "opacity-70" : "hover:scale-105"}`}
                        >
                          {isSaving ? "Saving..." : "Save Painting"}
                        </button>
                      </div>

                      <div className="flex flex-col gap-4 rounded-4xl bg-white/75 p-4 shadow-md">
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                setSelectedColor(color)
                                setTool("brush")
                              }}
                              className={`h-11 w-11 rounded-full border-4 transition hover:scale-110 ${
                                selectedColor === color && tool === "brush" ? "border-slate-800" : "border-white"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}

                          <label className="flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                            Pick Color
                            <input
                              type="color"
                              value={selectedColor}
                              onChange={(e) => {
                                setSelectedColor(e.target.value)
                                setTool("brush")
                              }}
                              className="h-10 w-10 cursor-pointer rounded-full border-0 bg-transparent"
                            />
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-3xl bg-slate-50 px-5 py-4">
                            <div className="mb-2 text-sm font-bold text-slate-700">Brush Size: {brushSize}px</div>
                            <input
                              type="range"
                              min="2"
                              max="40"
                              value={brushSize}
                              onChange={(e) => setBrushSize(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div className="rounded-3xl bg-slate-50 px-5 py-4">
                            <div className="mb-2 text-sm font-bold text-slate-700">Eraser Size: {eraserSize}px</div>
                            <input
                              type="range"
                              min="8"
                              max="80"
                              value={eraserSize}
                              onChange={(e) => setEraserSize(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div ref={wrapperRef} className="w-full overflow-hidden rounded-4xl border-4 border-white bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                        <canvas
                          ref={canvasRef}
                          className="block w-full cursor-crosshair touch-none bg-white"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>

                      <div className="rounded-4xl bg-white/75 p-5 shadow-md">
                        <div
                          className={`mb-4 text-lg font-extrabold ${
                            isPink ? "text-pink-500" : "text-blue-500"
                          }`}
                        >
                          Saved Paintings
                        </div>

                        {savedPaintings.length === 0 ? (
                          <div className="rounded-3xl bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                            No saved paintings yet.
                          </div>
                        ) : (
                          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {savedPaintings.map((painting) => (
                              <div
                                key={painting.name}
                                className="overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_16px_35px_rgba(0,0,0,0.08)]"
                              >
                                <div className="overflow-hidden rounded-[1.25rem] bg-slate-50">
                                  <img
                                    src={painting.url}
                                    alt={painting.name}
                                    className="h-64 w-full object-contain"
                                  />
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-bold text-slate-700">
                                    {painting.name}
                                  </p>
                                  <button
                                    onClick={() => handleDeleteSavedPainting(painting.name)}
                                    className="rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-600 transition hover:scale-105"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 flex items-end justify-center gap-3 sm:gap-6">
              <div className="flex flex-col items-center">
                <div
                  className={`mb-2 h-16 w-0.5 ${
                    isPink ? "bg-pink-300" : "bg-sky-300"
                  }`}
                ></div>
                <div
                  className={`flex h-20 w-16 items-center justify-center rounded-full text-3xl shadow-lg ${
                    isPink ? "bg-pink-300" : "bg-sky-300"
                  }`}
                >
                  🎈
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`mb-2 h-20 w-0.5 ${
                    isPink ? "bg-rose-300" : "bg-cyan-300"
                  }`}
                ></div>
                <div
                  className={`flex h-24 w-20 items-center justify-center rounded-full text-4xl shadow-lg ${
                    isPink ? "bg-rose-300" : "bg-cyan-300"
                  }`}
                >
                  🎈
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`mb-2 h-16 w-0.5 ${
                    isPink ? "bg-fuchsia-300" : "bg-blue-300"
                  }`}
                ></div>
                <div
                  className={`flex h-20 w-16 items-center justify-center rounded-full text-3xl shadow-lg ${
                    isPink ? "bg-fuchsia-300" : "bg-blue-300"
                  }`}
                >
                  🎈
                </div>
              </div>
            </div>

            <p
              className={`mt-10 text-lg font-bold sm:text-xl ${
                isPink ? "text-rose-500" : "text-blue-500"
              }`}
            >
              Have a great day and have a happy birthday Baby Aqui! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}