import { WebSocketServer } from 'ws'
import http from 'http'

const WS_PORT = 8080
const HTTP_PORT = 8081

const clients = new Set()

const wss = new WebSocketServer({ port: WS_PORT })
console.log(`✅ WebSocket server listening ws://localhost:${WS_PORT}`)

wss.on('connection', (socket) => {
  clients.add(socket)
  console.log('🔌 Cliente conectado. Total:', clients.size)

  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      // Simple channel dispatch echo
      if (!msg.channel) return
      broadcast(msg)
    } catch (e) {
      console.warn('⚠️ Mensaje no válido:', e.message)
    }
  })

  socket.on('close', () => {
    clients.delete(socket)
    console.log('👋 Cliente desconectado. Total:', clients.size)
  })
})

function broadcast(payload) {
  const data = JSON.stringify(payload)
  for (const c of clients) {
    if (c.readyState === 1) {
      c.send(data)
    }
  }
}

// HTTP broadcast endpoint compatible con Python/Ruby
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}')
        broadcast(payload)
        const ok = JSON.stringify({ status: 'ok' })
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(ok) })
        res.end(ok)
      } catch (e) {
        const err = JSON.stringify({ error: e.message })
        res.writeHead(500, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(err) })
        res.end(err)
      }
    })
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(HTTP_PORT, () => {
  console.log(`✅ Broadcast HTTP endpoint http://localhost:${HTTP_PORT}/broadcast`)
})

// Heartbeat para limpiar conexiones muertas
setInterval(() => {
  for (const c of clients) {
    if (c.readyState !== 1) {
      clients.delete(c)
    }
  }
}, 10000)
