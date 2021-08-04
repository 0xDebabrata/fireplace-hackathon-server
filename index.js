import { createServer } from "http"
import { WebSocketServer } from "ws"

const server = createServer()
const wss = new WebSocketServer({ server })

// Hashmaps
const clients = {}
const parties = {}

server.listen("8080", () => {
    console.log("Server listening on port 8080")
})

wss.on("connection", (ws, req) => {
    ws.on("open", () => console.log("connection opened"))
    ws.on("close", () => console.log("connection closed"))
    ws.on("message", message => {
        // Message from client
        const result = JSON.parse(`${message}`)

        // User wants to create watchparty
        if (result.method === "create") {
            const clientId = result.clientId
            const partyId = result.partyId

            parties[partyId] = {
                "id": partyId,
                "playhead": 0
            }

            const payload = {
                "method": "create",
                "party": parties[partyId]
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payload))
            console.log("payload sent")
            console.log(JSON.stringify(payload))

        }
    })

    // Get client ID and nickname from req
    const clientId = req.url.substring(1)
    clients[clientId] = {
        "connection": ws,
    }
})


