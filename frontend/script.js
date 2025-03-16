const socket = io("http://localhost:5000");


let username = "";
let room = "";

function joinChat() {
    username = document.getElementById("username").value;
    room = document.getElementById("room").value;

    if (username.trim() && room.trim()) {
        document.getElementById("join-container").style.display = "none";
        document.getElementById("chat-container").style.display = "block";
        document.getElementById("room-title").innerText = `Room: ${room}`;

        socket.emit("joinRoom", { username, room });
    } else {
        alert("Please enter a username and room name.");
    }
}

// ✅ Receive messages from the server
socket.on("message", (data) => {
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;
    document.getElementById("messages").appendChild(messageDiv);
});

// ✅ Send messages to the server
function sendMessage() {
    const message = document.getElementById("message-input").value;
    if (message.trim()) {
        socket.emit("sendMessage", { username, message, room });
        document.getElementById("message-input").value = "";
    }
}
