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
            const src = result.src

            parties[partyId] = {
                "id": partyId,
                "src": src,
                "playhead": 0,
                "clients": []
            }

            const payload = {
                "method": "create",
                "party": parties[partyId]
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payload))
            console.log("payload sent")

        }

        // User wants to join watchparty
        if (result.method === "join") {
            const clientId = result.clientId
            const partyId = result.partyId

            const party = parties[partyId]

            if (party.clients.length >= 5) {
                // Send room filled notification
                return;
            }

            party.clients.push(clientId)

            const payload = {
                "method": "join",
                "party": party
            }

            // Notify everyone that a player has joined
            party.clients.forEach(c => {
                clients[c].connection.send(JSON.stringify(payload))
            })

            const con = clients[clientId].connection
            con.send(JSON.stringify(payload))
            console.log("payload sent")

        }

    })

    // Get client ID from req
    const clientId = req.url.substring(1)
    console.log("clientId", clientId)

    clients[clientId] = {
        "connection": ws,
    }

})


