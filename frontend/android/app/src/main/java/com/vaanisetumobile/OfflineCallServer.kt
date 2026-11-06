package com.vaanisetumobile

import android.util.Base64
import java.io.BufferedReader
import java.io.EOFException
import java.io.InputStream
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.Inet4Address
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executors

object OfflineCallServer {
    private var serverSocket: ServerSocket? = null
    private var serverThread: Thread? = null
    private val executor = Executors.newCachedThreadPool()
    var port: Int = 8080
        private set

    @Volatile
    private var isRunning = false

    // callId -> list of active client sessions
    private val rooms = ConcurrentHashMap<String, CopyOnWriteArrayList<ClientSession>>()

    fun isRunning(): Boolean = isRunning

    @Synchronized
    fun start(listenPort: Int = 8080) {
        if (isRunning) {
            if (port == listenPort) return
            stop()
        }
        port = listenPort
        isRunning = true

        serverThread = Thread({
            try {
                serverSocket = ServerSocket(port)
                serverSocket?.reuseAddress = true

                while (isRunning) {
                    try {
                        val client = serverSocket?.accept() ?: break
                        executor.execute {
                            handleConnection(client)
                        }
                    } catch (_: Exception) {
                        break
                    }
                }
            } catch (e: Exception) {
                isRunning = false
            }
        }, "OfflineCallServer-Acceptor").apply {
            isDaemon = true
            start()
        }
    }

    @Synchronized
    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (_: Exception) {}
        serverSocket = null

        // Disconnect all clients and clear rooms
        for (roomList in rooms.values) {
            for (client in roomList) {
                client.close()
            }
        }
        rooms.clear()
    }

    fun getLocalIp(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val iface = interfaces.nextElement()
                if (iface.isLoopback || !iface.isUp) continue
                val addresses = iface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        val ip = addr.hostAddress
                        if (ip != null && !ip.startsWith("127.")) {
                            return ip
                        }
                    }
                }
            }
        } catch (_: Exception) {}
        return "192.168.43.1"
    }

    private fun handleConnection(socket: Socket) {
        try {
            val input = socket.getInputStream()
            val reader = BufferedReader(InputStreamReader(input, Charsets.UTF_8))
            val output = socket.getOutputStream()

            val requestLine = reader.readLine() ?: return
            val parts = requestLine.split(" ")
            if (parts.size < 2) return

            val method = parts[0].uppercase()
            val path = parts[1]

            // Read HTTP headers
            val headers = mutableMapOf<String, String>()
            while (true) {
                val line = reader.readLine() ?: break
                if (line.isEmpty()) break
                val colonIdx = line.indexOf(":")
                if (colonIdx > 0) {
                    val key = line.substring(0, colonIdx).trim().lowercase()
                    val value = line.substring(colonIdx + 1).trim()
                    headers[key] = value
                }
            }

            // 1. Health check: GET /health
            if (method == "GET" && path.startsWith("/health")) {
                val json = "{\"status\":\"ok\",\"service\":\"VaaniSetu Embedded Offline Host\",\"active_rooms\":${rooms.size}}"
                writeHttpResponse(output, 200, "OK", "application/json", json)
                socket.close()
                return
            }

            // 2. Session registration: POST /sessions/register
            if (method == "POST" && path.startsWith("/sessions/register")) {
                val contentLength = headers["content-length"]?.toIntOrNull() ?: 0
                if (contentLength > 0) {
                    val bodyChars = CharArray(contentLength)
                    var read = 0
                    while (read < contentLength) {
                        val r = reader.read(bodyChars, read, contentLength - read)
                        if (r == -1) break
                        read += r
                    }
                }
                val json = "{\"status\":\"registered\",\"paired\":true}"
                writeHttpResponse(output, 200, "OK", "application/json", json)
                socket.close()
                return
            }

            // 3. End call: DELETE /sessions/...
            if (method == "DELETE" && path.startsWith("/sessions")) {
                writeHttpResponse(output, 200, "OK", "application/json", "{\"status\":\"ended\"}")
                socket.close()
                return
            }

            // 4. WebSocket Upgrade: GET /ws/{callId}/{userId}
            val isUpgrade = headers["upgrade"]?.equals("websocket", ignoreCase = true) == true
            if (method == "GET" && isUpgrade) {
                val wsKey = headers["sec-websocket-key"] ?: return
                val acceptKey = computeWebSocketAccept(wsKey)

                val response = "HTTP/1.1 101 Switching Protocols\r\n" +
                        "Upgrade: websocket\r\n" +
                        "Connection: Upgrade\r\n" +
                        "Sec-WebSocket-Accept: $acceptKey\r\n\r\n"
                output.write(response.toByteArray(Charsets.UTF_8))
                output.flush()

                // Extract callId and userId from path: /ws/{callId}/{userId}
                val pathClean = path.split("?")[0].trim('/')
                val segments = pathClean.split('/')
                val callId = if (segments.size >= 2) segments[1] else "demo-call"
                val userId = if (segments.size >= 3) segments[2] else "user-${System.currentTimeMillis() % 1000}"

                val session = ClientSession(socket, input, output, callId, userId)
                val roomList = rooms.computeIfAbsent(callId) { CopyOnWriteArrayList() }
                roomList.add(session)

                // Notify this user of connection
                val isPaired = roomList.size >= 2
                session.sendText("{\"type\":\"status\",\"paired\":$isPaired}")

                // If now paired, notify all peers in the room
                if (isPaired) {
                    for (peer in roomList) {
                        peer.sendText("{\"type\":\"status\",\"paired\":true}")
                    }
                }

                session.runLoop { frameData, isText ->
                    val otherPeers = roomList.filter { it != session }
                    for (peer in otherPeers) {
                        if (isText) {
                            peer.sendText(String(frameData, Charsets.UTF_8))
                        } else {
                            peer.sendBinary(frameData)
                        }
                    }
                }

                // Cleanup on disconnect
                roomList.remove(session)
                if (roomList.isEmpty()) {
                    rooms.remove(callId)
                } else {
                    for (peer in roomList) {
                        peer.sendText("{\"type\":\"status\",\"paired\":false}")
                    }
                }
                return
            }

            // Default fallback response
            writeHttpResponse(output, 404, "Not Found", "text/plain", "Not Found")
            socket.close()
        } catch (_: Exception) {
            try {
                socket.close()
            } catch (_: Exception) {}
        }
    }

    private fun writeHttpResponse(
        output: OutputStream,
        statusCode: Int,
        statusText: String,
        contentType: String,
        body: String
    ) {
        val bodyBytes = body.toByteArray(Charsets.UTF_8)
        val headers = "HTTP/1.1 $statusCode $statusText\r\n" +
                "Content-Type: $contentType\r\n" +
                "Content-Length: ${bodyBytes.size}\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Access-Control-Allow-Methods: *\r\n" +
                "Access-Control-Allow-Headers: *\r\n" +
                "Connection: close\r\n\r\n"
        output.write(headers.toByteArray(Charsets.UTF_8))
        output.write(bodyBytes)
        output.flush()
    }

    private fun computeWebSocketAccept(key: String): String {
        val magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
        val md = MessageDigest.getInstance("SHA-1")
        val digest = md.digest((key.trim() + magic).toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(digest, Base64.NO_WRAP)
    }

    class ClientSession(
        private val socket: Socket,
        private val input: InputStream,
        private val output: OutputStream,
        val callId: String,
        val userId: String
    ) {
        @Volatile
        var isClosed = false

        fun sendText(text: String) {
            if (isClosed) return
            try {
                sendFrame(0x1, text.toByteArray(Charsets.UTF_8))
            } catch (_: Exception) {
                close()
            }
        }

        fun sendBinary(data: ByteArray) {
            if (isClosed) return
            try {
                sendFrame(0x2, data)
            } catch (_: Exception) {
                close()
            }
        }

        private fun sendFrame(opcode: Int, payload: ByteArray) {
            synchronized(output) {
                val b0 = 0x80 or (opcode and 0x0F)
                output.write(b0)
                val len = payload.size
                if (len <= 125) {
                    output.write(len)
                } else if (len <= 65535) {
                    output.write(126)
                    output.write((len shr 8) and 0xFF)
                    output.write(len and 0xFF)
                } else {
                    output.write(127)
                    for (i in 7 downTo 0) {
                        output.write(((len.toLong() shr (i * 8)) and 0xFF).toInt())
                    }
                }
                output.write(payload)
                output.flush()
            }
        }

        fun runLoop(onFrameReceived: (ByteArray, Boolean) -> Unit) {
            try {
                while (!isClosed && socket.isConnected && !socket.isClosed) {
                    val b0 = input.read()
                    if (b0 == -1) break
                    val opcode = b0 and 0x0F
                    if (opcode == 0x8) break // Connection Close

                    val b1 = input.read()
                    if (b1 == -1) break
                    val masked = (b1 and 0x80) != 0
                    var length = (b1 and 0x7F).toLong()

                    if (length == 126L) {
                        val lenBytes = ByteArray(2)
                        readFully(input, lenBytes)
                        length = (((lenBytes[0].toInt() and 0xFF) shl 8) or (lenBytes[1].toInt() and 0xFF)).toLong()
                    } else if (length == 127L) {
                        val lenBytes = ByteArray(8)
                        readFully(input, lenBytes)
                        var l = 0L
                        for (i in 0 until 8) {
                            l = (l shl 8) or (lenBytes[i].toInt() and 0xFF).toLong()
                        }
                        length = l
                    }

                    val mask = ByteArray(4)
                    if (masked) {
                        readFully(input, mask)
                    }

                    val payload = ByteArray(length.toInt())
                    readFully(input, payload)

                    if (masked) {
                        for (i in payload.indices) {
                            payload[i] = (payload[i].toInt() xor mask[i % 4].toInt()).toByte()
                        }
                    }

                    if (opcode == 0x9) {
                        // Ping -> Send Pong
                        sendFrame(0xA, payload)
                        continue
                    }

                    val isText = (opcode == 0x1)
                    if (opcode == 0x1 || opcode == 0x2) {
                        onFrameReceived(payload, isText)
                    }
                }
            } catch (_: Exception) {
            } finally {
                close()
            }
        }

        private fun readFully(stream: InputStream, buffer: ByteArray) {
            var total = 0
            while (total < buffer.size) {
                val r = stream.read(buffer, total, buffer.size - total)
                if (r == -1) throw EOFException("End of stream")
                total += r
            }
        }

        fun close() {
            isClosed = true
            try {
                socket.close()
            } catch (_: Exception) {}
        }
    }
}
