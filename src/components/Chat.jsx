import {useEffect, useRef, useState} from 'react';
import styles from "./css/Chat.module.css";
import backButton from "./css/Main.module.css";
import Login from "./Login";
import SockJS from 'sockjs-client';
import {Stomp} from '@stomp/stompjs';
import Recorder from "opus-recorder";
import Main from "./Main";
import {Helmet} from "react-helmet";


function Chat(props) {
    const [messages, setMessages] = useState([]);
    const [page, setPage] = useState(0);
    const chatMessagesRef = useRef(null);
    const [error, setError] = useState("")
    const [currentUser] = useState(JSON.parse(localStorage.getItem("currentUser")))
    const [chatWebSocket, setChatWebSocket] = useState("")
    const [allLoaded, setAllLoaded] = useState(false)
    const [onlineStatus, setOnlineStatus] = useState("")
    const [isRecording, setRecording] = useState(false);
    const [isBackButtonClicked, setBackButtonClicked] = useState(false);
    const recorderRef = useRef(null);
    const audioDataRef = useRef([]);

    useEffect(() => {
        const loadMessages = async () => {
            if (allLoaded) return
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/${props.id}?page=${page}&count=20`;
                const token = localStorage.getItem("jwt-token");
                const response = await fetch(URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!data.messages.length) {
                    setAllLoaded(true)
                    return
                }
                setChatWebSocket(data.web_socket)
                const newMessages = []
                for (let message of data.messages) {
                    const id = message.message_id
                    const isCurrentUser = message.sender.id === currentUser.id
                    const sentTime = parseSentTime(message.sent_time)
                    const loadFileAddress = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/message/${id}/file`
                    switch (message.type) {
                        case "IMAGE":
                            const image = await loadFile(loadFileAddress)
                            newMessages.unshift(
                                {
                                    id: id,
                                    message:
                                        <div>
                                            <img
                                                className={isCurrentUser ? styles.messageMediaSelf : styles.messageMediaUser}
                                                src={image}/>
                                            <div
                                                className={isCurrentUser ? styles.mediaSentTimeSelf : styles.mediaSentTimeUser}>
                                                {sentTime}
                                                <button className={styles.button}
                                                        onClick={() => downloadImage(image)}>⬇️
                                                </button>
                                                {isCurrentUser ? <button className={styles.button}
                                                                         onClick={() => deleteMessage(id)}>🗑️</button> : ""}
                                            </div>
                                        </div>
                                }
                            )
                            break
                        case "VIDEO":
                            newMessages.unshift(
                                {
                                    id: id,
                                    message:
                                        <div>
                                            <div id={"video-container"}>
                                                <div
                                                    className={isCurrentUser ? styles.videoDownloadSelf : styles.videoDownloadUser}
                                                    onClick={(event) => handleLoadVideoClick(event, loadFileAddress,
                                                        isCurrentUser ? styles.messageMediaSelf : styles.messageMediaUser, id)}
                                                />
                                            </div>
                                            <div
                                                className={isCurrentUser ? styles.mediaSentTimeSelf : styles.mediaSentTimeUser}>
                                                {sentTime}
                                                {isCurrentUser ? <button className={styles.button}
                                                                         onClick={() => deleteMessage(id)}>🗑️</button> : ""}
                                            </div>
                                        </div>
                                }
                            )
                            break
                        case "AUDIO_OGG":
                            const audio = await loadFile(loadFileAddress);
                            newMessages.unshift(
                                {
                                    id: id,
                                    message:
                                        <div>
                                            <audio src={audio} controls={true}
                                                   className={isCurrentUser ? styles.audioMessageSelf : styles.audioMessageUser}/>
                                            <div
                                                className={isCurrentUser ? styles.mediaSentTimeSelf : styles.mediaSentTimeUser}>
                                                {sentTime}
                                                {isCurrentUser ? <button className={styles.button}
                                                                         onClick={() => deleteMessage(id)}>🗑️</button> : ""}
                                            </div>
                                        </div>
                                }
                            )
                            break
                        default:
                            newMessages.unshift(
                                {
                                    id: id,
                                    message:
                                        <div id={"message-container"}
                                             className={isCurrentUser ? styles.chatMessageSelf : styles.chatMessageUser}>
                                            <div>{message.message}</div>
                                            <div></div>
                                            {sentTime}
                                            {isCurrentUser ? <button className={styles.button}
                                                                     onClick={() => deleteMessage(id)}>🗑️</button> : ""}
                                            {isCurrentUser ? <button className={styles.button} onClick={(event) =>
                                                updateMessage(event, id)}>✏️</button> : ""}
                                        </div>
                                }
                            )
                    }
                }
                setMessages(prevMessages => [
                    ...newMessages,
                    ...prevMessages
                ])
                if (!onlineStatus) {
                    setOnlineStatus(data.user.online_status)
                }
            } catch (error) {
                setError(process.env.REACT_APP_CONNECTION_ERROR)
            }
        }
        loadMessages();
    }, [page]);

    useEffect(() => {
        if (chatMessagesRef.current && page === 0 && chatMessagesRef.current.scrollHeight) {
            lowerScroll()
        }
    }, [messages]);

    const handleChatScroll = () => {
        if (chatMessagesRef.current) {
            if (chatMessagesRef.current.scrollTop === 0) {
                const currentScrollPosition = chatMessagesRef.current.scrollHeight;
                setPage((prevPage) => prevPage + 1);
                setTimeout(() => {
                    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight - currentScrollPosition;
                }, 200);
            }
        }
    }

    useEffect(() => {
        const chatMessagesElement = chatMessagesRef.current;
        if (chatMessagesElement) {
            chatMessagesElement.addEventListener('scroll', handleChatScroll);
        }
        return () => {
            if (chatMessagesElement) {
                chatMessagesElement.removeEventListener('scroll', handleChatScroll);
            }
        }
    }, []);

    async function sendMessage() {
        setError("")
        let message = document.getElementById("message").value
        if (message === "") return
        try {
            const token = localStorage.getItem("jwt-token")
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/${props.id}/message`
            const response = await fetch(URL, {
                body: JSON.stringify({
                    message: message
                }),
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            const data = await response.json()
            if (!response.ok) {
                if (response.status === 401) {
                    setError("authorization")
                } else {
                    setError(data.message)
                }
            } else {
                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        id: data.id,
                        message:
                            <div id={"message-container"} className={styles.chatMessageSelf}>
                                <div>{message}</div>
                                <div></div>
                                {getSentTime()}
                                <button className={styles.button} onClick={() => deleteMessage(data.id)}>🗑️</button>
                                <button className={styles.button}
                                        onClick={(event) => updateMessage(event, data.id)}>✏️
                                </button>
                            </div>
                    }
                ])
                document.getElementById("message").value = ""
                lowerScroll()
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    async function sendImage(e) {
        const token = localStorage.getItem("jwt-token")
        const image = e.target.files[0]
        const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/${props.id}/message/image`
        const formData = new FormData()
        formData.append("image", image)
        try {
            const response = await fetch(URL, {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.message)
            } else {
                const imageUrl = window.URL.createObjectURL(image)
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        id: data.id,
                        message:
                            <div>
                                <img className={styles.messageMediaSelf} src={imageUrl}/>
                                <div className={styles.mediaSentTimeSelf}>
                                    {getSentTime()}
                                    <button className={styles.button} onClick={() => downloadImage(imageUrl)}>⬇️
                                    </button>
                                    <button className={styles.button} onClick={() => deleteMessage(data.id)}>🗑️</button>
                                </div>
                            </div>
                    }
                ])
                lowerScroll()
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    async function sendVideo(e) {
        const video = e.target.files[0]
        const token = localStorage.getItem("jwt-token")
        const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/${props.id}/message/video`
        const formData = new FormData()
        formData.append("video", video)
        try {
            const response = await fetch(URL, {
                body: formData,
                method: "POST",
                headers: {Authorization: `Bearer ${token}`}
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.message)
            } else {
                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        id: data.id,
                        message:
                            <div>
                                <video className={styles.messageMediaSelf} src={window.URL.createObjectURL(video)}
                                       controls={true}/>
                                <div className={styles.mediaSentTimeSelf}>
                                    {getSentTime()}
                                    <button className={styles.button} onClick={() => deleteMessage(data.id)}>🗑️</button>
                                </div>
                            </div>
                    }
                ])
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    function handleStartRecording() {
        const recorder = new Recorder({
            encoderPath: 'opus-recorder/encoderWorker.min.js',
            encoderApplication: 2049,
            encoderBitRate: 64000,
            streamPages: true,
            numberOfChannels: 1,
            originalSampleRateOverride: 44100,
        })
        recorderRef.current = recorder;
        audioDataRef.current = [];
        recorder.ondataavailable = (typedArray) => {
            audioDataRef.current.push(typedArray)
        }
        recorder.start().then(() => {
            setRecording(true);
        });
    }

    async function handleStopRecording() {
        if (recorderRef.current) {
            recorderRef.current.stop().then(async () => {
                setRecording(false);
                const audioBlob = new Blob(audioDataRef.current, {type: "audio/ogg"});
                const audioURL = URL.createObjectURL(audioBlob);
                try {
                    const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/${props.id}/message/audio/ogg`;
                    const token = localStorage.getItem("jwt-token");
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "audio-message.ogg");
                    const response = await fetch(URL, {
                        method: "POST",
                        body: formData,
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    const data = await response.json();
                    if (!response.ok) {
                        setError(data.message);
                    } else {
                        setMessages(prevMessages => [
                            ...prevMessages,
                            {
                                id: data.id,
                                message:
                                    <div>
                                        <audio src={audioURL} controls={true} className={styles.audioMessageSelf}/>
                                        <div className={styles.mediaSentTimeSelf}>
                                            {getSentTime()}
                                            <button className={styles.button} onClick={() => deleteMessage(data.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                            }
                        ]);
                    }
                } catch (error) {
                    setError(process.env.REACT_APP_CONNECTION_ERROR)
                }
            });
        }
    }


    useEffect(() => {
        const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/ws`
        const sockjs = new SockJS(URL)
        const stompClient = Stomp.over(sockjs)
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("jwt-token")}`
        }
        stompClient.connect(headers, () => {
            stompClient.subscribe(`/topic/chat/${chatWebSocket}`, async (message) => {
                let parsedMessage = JSON.parse(message.body);
                let deletedMessageId = parsedMessage.deleted_message_id;
                if (deletedMessageId) {
                    setMessages(prevMessages => [...prevMessages.filter((message) => message.id !== deletedMessageId)])
                } else if (parsedMessage.updated_message && parsedMessage.sender_id !== currentUser.id) {
                    setMessages((prevMessages) => {
                        return [...prevMessages.map((message) => {
                            if (message.id === parsedMessage.message_id) {
                                message.message =
                                    <div id={"message-container"} className={styles.chatMessageUser}>
                                        <div>{parsedMessage.updated_message}</div>
                                        <div></div>
                                        {parseSentTime(parsedMessage.sent_time)}
                                        <button className={styles.button}
                                                onClick={() => deleteMessage(message.id)}>🗑️
                                        </button>
                                        <button className={styles.button} onClick={(event) =>
                                            updateMessage(event, message.id)}>✏️
                                        </button>
                                    </div>
                            }
                            return message;
                        })]
                    })
                } else if (parsedMessage.updated_user_online_status_id && parsedMessage.updated_user_online_status_id !== currentUser.id) {
                    setOnlineStatus(parsedMessage.online_status)
                } else if (parsedMessage.sender?.id && parsedMessage.sender.id !== currentUser.id) {
                    const sentTime = parseSentTime(parsedMessage.sent_time)
                    const loadFileAddress = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/message/${parsedMessage.message_id}/file`
                    const id = parsedMessage.message_id
                    switch (parsedMessage.type) {
                        case "IMAGE":
                            const file = await loadFile(loadFileAddress)
                            setMessages(pervMessages => [
                                ...pervMessages,
                                {
                                    id: id,
                                    message:
                                        <div>
                                            <img className={styles.messageMediaUser} src={file}/>
                                            <div className={styles.mediaSentTimeUser}>
                                                {sentTime}
                                                <button className={styles.button}
                                                        onClick={() => downloadImage(file)}>⬇️
                                                </button>
                                            </div>
                                        </div>
                                }
                            ])
                            break
                        case "VIDEO":
                            setMessages(prevMessages => [
                                ...prevMessages,
                                {
                                    id: id,
                                    message:
                                        <div>
                                            <div id={"video-container"}>
                                                <div className={styles.videoDownloadUser}
                                                     onClick={(event) =>
                                                         handleLoadVideoClick(event, loadFileAddress, styles.messageMediaUser)}
                                                />
                                            </div>
                                            <div className={styles.mediaSentTimeUser}>
                                                {sentTime}
                                            </div>
                                        </div>
                                }
                            ])
                            break
                        case "AUDIO_OGG":
                            const audio = await loadFile(loadFileAddress);
                            setMessages(prevMessages => [
                                ...prevMessages,
                                {
                                    id: id,
                                    message:
                                        <div>
                                            <audio src={audio} controls={true} className={styles.audioMessageUser}/>
                                            <div className={styles.mediaSentTimeUser}>{getSentTime()}</div>
                                        </div>
                                }
                            ])
                            break
                        default:
                            setMessages(prevMessages => [
                                ...prevMessages,
                                {
                                    id: id,
                                    message:
                                        <div className={styles.chatMessageUser}>
                                            {parsedMessage.message}
                                            <div></div>
                                            {sentTime}
                                        </div>
                                }
                            ]);
                    }
                    lowerScroll()
                }
            })
        })

    }, [chatWebSocket]);

    async function loadFile(address) {
        try {
            const token = localStorage.getItem("jwt-token")
            const response = await fetch(address, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (!response.ok) {
                const data = await response.json()
                setError(data.message)
            } else {
                const data = await response.blob()
                return window.URL.createObjectURL(data)
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    async function deleteMessage(id) {
        console.log(id)
        const token = localStorage.getItem("jwt-token")
        const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/message/${id}`
        try {
            const response = await fetch(URL, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (!response.ok) {
                const data = await response.json()
                setError(data.message)
            } else {
                setMessages(prevMessages => [...prevMessages.filter((message) => message.id !== id)])
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    async function updateMessage(event, id) {
        const target = event.target;
        const container = target.closest("#message-container");
        const messageElem = container.querySelector("div");
        const oldMessage = messageElem.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.className = styles.chatMessageSelf;
        input.value = oldMessage;
        input.style.fontSize = "20px"
        input.style.backgroundColor = "white"
        input.style.color = "black"
        const changeMessage = async () => {
            if (!input.value) {
                messageElem.textContent = oldMessage;
            } else {
                try {
                    const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats/message/${id}`
                    await fetch(URL, {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message: input.value
                        })
                    })
                    messageElem.textContent = input.value;
                } catch (error) {
                    setError(process.env.REACT_APP_CONNECTION_ERROR)
                } finally {
                    input.remove();
                }
            }
        }
        input.addEventListener("blur", () => {
            messageElem.textContent = oldMessage;
            input.remove();
        })
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                changeMessage()
            }
        })
        messageElem.innerHTML = '';
        messageElem.append(input);
        lowerScroll()
    }

    function getSentTime() {
        let now = new Date();
        return [
            now.getFullYear(), '-',
            (now.getMonth() < 10 ? '0' : ''), now.getMonth(), '-',
            (now.getDate() < 10 ? '0' : ''), now.getDate(), ' ',
            (now.getHours() < 10 ? '0' : ''), now.getHours(), ':',
            (now.getMinutes() < 10 ? '0' : ''), now.getMinutes()
        ].join('');
    }

    const parseSentTime = (time) => time.substring(0, time.lastIndexOf(":")).replace("T", " ")

    const handleLoadVideoClick = async (event, address, className, id) => {
        let target = event.target
        target.style.setProperty('--loading-text', '"Loading..."')
        let video = await loadFile(address)
        let videoElem = document.createElement("video")
        videoElem.src = video
        videoElem.className = className
        videoElem.controls = true
        let parent = target.closest("#video-container")
        target.remove()
        parent.append(videoElem)
        localStorage.setItem(`/chats/${id}`, video)
    }

    const downloadImage = (file) => {
        let ref = document.createElement('a')
        ref.href = file
        ref.download = file
        ref.click()
        ref.remove()
    }

    const lowerScroll = () => {
        try {
            setTimeout(() => {
                if (chatMessagesRef.current?.scrollHeight) {
                    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
                }
            }, 100)
        } catch (error) {
        }
    }

    if (error === "authorization") {
        return <Login/>
    }
    if (isBackButtonClicked) {
        return <Main/>
    }
    return (
        <div>
            <Helmet>
                <body className={styles.body}/>
            </Helmet>
            <button className={backButton.backButton} onClick={() => setBackButtonClicked(true)}>⬅</button>
            <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                    {props.name}
                    <div></div>
                    <div style={{
                        color: onlineStatus === "ONLINE" ? "darkblue" : "red",
                        marginTop: "10px"
                    }}>{onlineStatus}</div>
                </div>
                <div className={styles.chatMessages} id="chat-messages" ref={chatMessagesRef}>
                    {messages.map(message => message.message)}
                    <div className={styles.error} onClick={() => setError("")}>{error}</div>
                </div>
                <div className={styles.chatInputContainer}>
                    <input type="text" className={styles.chatInput} id="message" placeholder="Enter message..."/>
                    <button id={"send-button"} className={styles.sendButton} onClick={sendMessage}>Send</button>
                    <button className={styles.sendButton} onClick={() => {
                        let input = document.createElement("input")
                        input.style.display = "none"
                        input.type = "file"
                        input.accept = "image/*"
                        input.click()
                        input.oninput = sendImage
                    }}>Image
                    </button>
                    <button className={styles.sendButton} onClick={() => {
                        let input = document.createElement("input")
                        input.style.display = "none"
                        input.type = "file"
                        input.accept = "video/*"
                        input.click()
                        input.oninput = sendVideo
                    }}>Video
                    </button>
                    <button className={styles.voiceMessageButton}
                            onClick={isRecording ? handleStopRecording : handleStartRecording}>
                        {isRecording ? "⏹️" : "🎙️"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chat;