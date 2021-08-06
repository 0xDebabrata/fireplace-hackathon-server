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

    let currentPartyId

    ws.on("open", () => console.log("connection opened"))
    ws.on("close", () => {

        if (clientId && currentPartyId) {
            const party = parties[currentPartyId]

            const payload = {
                "method": "leave",
                "nickname": clients[clientId].nickname
            }

            party.clients.forEach(c => {
                if (c !== clientId) {
                    clients[c].connection.send(JSON.stringify(payload))
                }
            })

            console.log("leave payload sent")

        } else {
            return
        }
    })

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

            currentPartyId = partyId

            console.log(nickname + " joined " + currentPartyId)

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

        // Creator has played video
        if (result.method === "play") {
            const clientId = result.clientId
            const partyId = result.partyId

            const party = parties[partyId]

            const payload = {
                "method": "play",
            }

            party.clients.forEach(c => {
                if (c !== clientId) {
                    clients[c].connection.send(JSON.stringify(payload))
                }
            })

        }

        // Creator has paused video
        if (result.method === "pause") {
            const clientId = result.clientId
            const partyId = result.partyId

            const party = parties[partyId]

            const payload = {
                "method": "pause",
            }

            party.clients.forEach(c => {
                if (c !== clientId) {
                    clients[c].connection.send(JSON.stringify(payload))
                }
            })

        }

        // Creator has seeked video
        if (result.method === "seeked") {
            const clientId = result.clientId
            const partyId = result.partyId
            const playhead = result.playhead

            const party = parties[partyId]

            const payload = {
                "method": "seeked",
                "playhead": playhead
            }

            party.clients.forEach(c => {
                if (c !== clientId) {
                    clients[c].connection.send(JSON.stringify(payload))
                }
            })
        }

        // Update playhead state
        if (result.method === "update") {
            const partyId = result.partyId
            const playhead = result.playhead

            parties[partyId].playhead = playhead
        }


    })

    // Get client ID from req
    const clientId = req.url.substring(1)

    clients[clientId] = {
        "connection": ws,
    }

})


