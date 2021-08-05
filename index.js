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
            console.log("create response sent")

        }

        // User wants to join watchparty
        if (result.method === "join") {
            const clientId = result.clientId
            const partyId = result.partyId
            const nickname = result.nickname

            console.log(nickname + "joined")

            clients[clientId]["nickname"] = nickname

            const party = parties[partyId]

            //if (party.clients.length >= 5) {
                // Send room filled notification
             //   return;
            //}

            if (!party.clients.includes(clientId)) {
                party.clients.push(clientId)
            }

            const payloadToJoiningClient = {
                "method": "join",
                "party": party
            }

            const payloadToJoinedClients = {
                "method": "new",
                "nickname": nickname
            }

            // Notify everyone that a player has joined
            party.clients.forEach(c => {
                if (c === clientId) {
                    clients[c].connection.send(JSON.stringify(payloadToJoiningClient))
                } else {
                    clients[c].connection.send(JSON.stringify(payloadToJoinedClients))
                }
            })

        }

        // User left watchparty
        if (result.method === "leave") {
            const clientId = result.clientId
            const partyId = result.partyId

            const party = parties[partyId]

            const payload = {
                "method": "leave",
                "nickname": clients[clientId].nickname
            }

            party.clients.forEach(c => {
                if (c !== clientId) {
                    clients[c].connection.send(JSON.stringify(payload))
                }
            })
        }

    })

    // Get client ID from req
    const clientId = req.url.substring(1)

    clients[clientId] = {
        "connection": ws,
    }

})


