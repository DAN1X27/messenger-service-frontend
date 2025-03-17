import Login from "./Login";
import {useEffect, useState} from "react";
import styles from "./css/Main.module.css"
import EditProfile from "./EditProfile";
import Chat from "./Chat";
import Group from "./Group";
import Channel from "./Channel";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import {Helmet} from "react-helmet";

function Main() {
    const [error, setError] = useState("");
    const [user, setUser] = useState({});
    const [image, setImage] = useState("");
    const [page, setPage] = useState("main");
    const [chats, setChats] = useState([]);
    const [groups, setGroups] = useState([]);
    const [channels, setChannels] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [chatSelected, setChatSelected] = useState(false)
    const [selectedChat, setSelectedChat] = useState({});
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [overlay, setOverlay] = useState("");
    const token = localStorage.getItem("jwt-token");

    useEffect(() => {
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/ws`;
            const headers = {
                Authorization: `Bearer ${localStorage.getItem("jwt-token")}`
            }
            const socket = new SockJS(URL);
            const stompClient = Stomp.over(socket);
            stompClient.connect(headers, () => {
                stompClient.send("/app/status/online");
                document.addEventListener("visibilitychange", () => {
                    if (document.visibilityState === "hidden") {
                        stompClient.send("/app/status/offline")
                    } else {
                        stompClient.send("/app/status/online")
                    }
                });
                setInterval(() => {
                    if (document.visibilityState === "visible") {
                        console.log(document.visibilityState)
                        stompClient.send("/app/status/online")
                    }
                }, 120000)
            })
        } catch (error) {
            console.log(error)
            setError(process.env.REACT_APP_CONNECTION_ERROR);
        }
    }, []);

    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const token = localStorage.getItem("jwt-token")
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/info`
                const response = await fetch(URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                })
                if (!response.ok) {
                    localStorage.removeItem("jwt-token")
                    setError("authorization")
                }
                const data = await response.json()
                setUser(data)
                localStorage.setItem("currentUser", JSON.stringify(data));
                console.log(JSON.parse(localStorage.getItem("currentUser")));
            } catch (error) {
                setError(process.env.REACT_APP_CONNECTION_ERROR)
            }
        }
        loadUserInfo()
    }, [])
    useEffect(() => {
        const loadUserImage = async () => {
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/image`
                const response = await fetch(URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                const image = await response.blob()
                const imageUrl = window.URL.createObjectURL(image)
                setImage(imageUrl)
            } catch (error) {
                setError(process.env.REACT_APP_CONNECTION_ERROR)
            }
        }
        loadUserImage()
    }, []);
    useEffect(() => {
        const loadChats = async () => {
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/chats`
                const response = await fetch(URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })

                const data = await response.json()
                const chatsComponents = data.map(async (chat) => {
                    const image = await loadImage(`${process.env.REACT_APP_SERVER_ADDRESS}/user/image/${chat.user.id}`)
                    return (
                        <div>
                            <div className={styles.container}
                                 onClick={() => {
                                     setSelectedChat(
                                         <Chat
                                             id={chat.id}
                                             key={chat.id}
                                             name={chat.user.username}
                                             onlineStatus={chat.user["online_status"]}
                                             isBanned={chat.user.banned}
                                             image={image}
                                         />
                                     )
                                     setChatSelected(true)
                                 }}>
                                <img className={styles.image} src={image}/>
                                {chat.user.username} (CHAT)
                            </div>
                        </div>
                    )
                })
                setChats(chatsComponents)
            } catch (error) {
                setError(process.env.REACT_APP_CONNECTION_ERROR)
            }
        }
        const loadGroups = async () => {
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/groups`
                const response = await fetch(URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                const data = await response.json()
                const groupComponents = data.map(async (group) => {
                    const image = await loadImage(`${process.env.REACT_APP_SERVER_ADDRESS}/groups/${group.id}/image`)
                    return (
                        <div>
                            <div className={styles.container}
                                 onClick={() => {
                                     setSelectedChat(
                                         <Group
                                             key={group.id}
                                             id={group.id}
                                             name={group.name}
                                             description={group.description}
                                             image={image}
                                         />
                                     )
                                     setChatSelected(true)
                                 }}>
                                <img className={styles.image} src={image}/>
                                {group.name} (GROUP)
                            </div>
                        </div>
                    )
                })
                setGroups(groupComponents)
            } catch (error) {
                setError(process.env.REACT_APP_CONNECTION_ERROR)
            }
        }
        const loadChannels = async () => {
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/channels`
                const response = await fetch(URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                const data = await response.json()
                const channelComponents = data.map(async (channel) => {
                    const image = await loadImage(`${process.env.REACT_APP_SERVER_ADDRESS}/channels/${channel.id}/image`)

                    return (
                        <div>
                            <div className={styles.container}
                                 onClick={() => {
                                     setSelectedChat(
                                         <Channel
                                             key={channel.id}
                                             id={channel.id}
                                             name={channel.name}
                                             description={channel.description}
                                             image={image}
                                         />
                                     )
                                     setChatSelected(true)
                                 }}>
                                <img className={styles.image} src={image}/>
                                {channel.name} (CHANNEL)
                            </div>
                        </div>
                    )
                })
                setChannels(channelComponents)
            } catch (error) {
                setError(process.env.REACT_APP_CONNECTION_ERROR)
            }

        }
        loadChats()
        loadGroups()
        loadChannels()
    }, []);

    async function loadImage(address) {
        try {
            const response = await fetch(address, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (!response.ok) {
                const data = await response.json()
                setError(data.message)
            }
            const data = await response.blob()
            return window.URL.createObjectURL(data)
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    async function logout() {
        // eslint-disable-next-line no-restricted-globals
        const ask = confirm("Do you really want to logout?")
        if (!ask) {
            return
        }
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/auth/logout`
            await fetch(URL, {
                method: "POST",
                headers: {"Authorization": `Bearer ${token}`}
            })
            setError("authorization")
            localStorage.removeItem("jwt-token")
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }

    async function deleteFriend(id) {
        const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/friend/${id}`
        try {
            const response = await fetch(URL, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const data = await response.json();
                setError(data.message);
            } else {
                setFriends(prevFriends => [...prevFriends.filter((friend) => friend.id !== id)])
                setSelectedFriend(null)
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR);
        }
    }

    async function sendFriendRequest() {
        const input = document.getElementById("friend-username");
        const username = input.value;
        const message = document.getElementById("friend-request-message")
        if (!username) {
            message.style.color = "red";
            message.textContent = "Username must not be empty";
            return;
        }
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/friend?username=${username}`;
            const response = await fetch(URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (!response.ok) {
                const data = await response.json();
                message.style.color = "red"
                message.textContent = data.message;
            } else {
                message.style.color = "#50ff50";
                message.textContent = "Request sent successfully!";
            }
        } catch (error) {
            message.style.color = "red";
            message.textContent = process.env.REACT_APP_CONNECTION_ERROR;
        }
    }

    async function loadFriends() {
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/friends`;
            const response = await fetch(URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await response.json();
            if (!response.ok) {
                setError(data.message);
            } else {
                const friendsComponents = await Promise.all(data.map(async (friend) => {
                    const image = await loadImage(`${process.env.REACT_APP_SERVER_ADDRESS}/user/image/${friend.id}`);
                    return {
                        id: friend.id,
                        data: (
                            <div className={styles.container} onClick={() => {
                                setSelectedFriend(
                                    <div className={styles.profile}>
                                        <img className={styles.profileImage} src={image} />
                                        <p>Username: {friend.username}</p>
                                        <p>Description: {friend.description ? friend.description : <b>(Not specified)</b>}</p>
                                        <p>Status: {friend.private ? "Private" : "Public"}</p>
                                        <button className={styles.button} onClick={() => deleteFriend(friend.id)}>Delete</button>
                                    </div>
                                );
                            }}>
                                <img src={image} className={styles.image} />
                                {friend.username}
                            </div>
                        )
                    };
                }));
                setFriends(friendsComponents);
                setPage("friends")
            }
        } catch (error) {
            setError(process.env.REACT_APP_SERVER_ADDRESS)
        }
    }

    async function loadFriendRequests() {
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/friends/requests`;
            const response = await fetch(URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await response.json();
            if (!response.ok) {
                setError(data.message);
            } else {
                const requests = await Promise.all(data.map(async (request) => {
                    const image = await loadImage(`${process.env.REACT_APP_SERVER_ADDRESS}/user/image/${request.id}`)
                    return {
                        id: request.id,
                        data: (
                            <div className={styles.container}>
                                <img src={image} className={styles.image}/>
                                {request.username}
                            </div>
                        )
                    }
                }));
                setFriendRequests(requests);
                setPage("friend-requests");
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR);
        }
    }

    // eslint-disable-next-line default-case
    switch (page) {
        case "profile":
            return (
                <div>
                    <Helmet>
                        <body className={styles.body}/>
                    </Helmet>
                    <div className={styles.profile}>
                        <img className={styles.profileImage} src={image}/>
                        <p>Username: {user.username}</p>
                        <p>Email: {user.email}</p>
                        <p>Description: {user.description ? user.description : <b>(Not specified)</b>}</p>
                        <p>Status: {user.private ? "Private" : "Public"}</p>
                        <button className={styles.backButton} onClick={() => setPage("main")}>⬅</button>
                        <div></div>
                        <div></div>
                        <button className={styles.button} onClick={() => setPage("edit")}>Edit profile</button>
                        <div></div>
                        <button className={styles.logoutButton} onClick={logout}>Logout</button>
                    </div>
                </div>

            )
        case "edit":
            return <EditProfile user={user} image={image}/>
        case "friends":
            const searchFriendElem = (
                <div>
                    <div className={styles.backButton} onClick={() => setPage("main")}>⬅</div>
                    <input id={"friend-username"} className={styles.search} type={"text"} placeholder={"Add friend"}/>
                    <div id={"friend-request-message"} style={{cursor: "default"}}
                         onClick={(event) => event.target.textContent = ''}></div>
                    <button onClick={sendFriendRequest} className={styles.button} style={{marginTop: "10px", width: "300px"}}>
                        Send friend request
                    </button>
                </div>
            )
            if (!friends.length) {
                return (
                    <div>
                        <Helmet>
                            <body className={styles.body}/>
                        </Helmet>
                        {searchFriendElem}
                        <div className={styles.centerMessage}>You don't have any friends yet 😢</div>
                    </div>
                )
            }
            return (
                <div>
                    <Helmet>
                        <body className={styles.body}/>
                    </Helmet>
                    <button className={styles.backButton} onClick={() => setPage("main")}>⬅</button>
                    {searchFriendElem}
                    {friends.map(friend => friend.data)}
                </div>
            )
        case "friend-requests":
            if (!friendRequests.length) {
                return (
                    <div>
                        <Helmet>
                            <body className={styles.body}/>
                        </Helmet>
                        <button className={styles.backButton} onClick={() => setPage("main")}>⬅</button>
                        <div>
                            <div className={styles.centerMessage}>It's empty here yet...</div>
                        </div>
                    </div>
                )
            }
            return (
                <div>
                    <Helmet>
                        <body className={styles.body}/>
                    </Helmet>
                    <button className={styles.backButton} onClick={() => setPage("main")}>⬅</button>
                    {friendRequests.map(request => request.data)}
                </div>
            )
    }
    if (chatSelected) {
        return selectedChat
    }
    if (selectedFriend) {
        return selectedFriend;
    }
    if (error === "authorization" || !token) {
        return <Login/>
    }
    if (error) {
        return (<div>{error}</div>)
    }
    return (
        <div>
            <Helmet>
                <body className={styles.body}/>
            </Helmet>
            <input className={styles.search} placeholder={"🔍Search chat"}/>
            <div></div>
            <button className={styles.button} style={{marginTop: "10px", width: "300px"}}>Search</button>
            <div></div>
            <div className={styles.infoButton} onClick={() => setPage("profile")}>
                <img className={styles.profileButtonImage} src={image}/>
                <div>{user.username}</div>
            </div>
            <div></div>
            <button className={styles.searchButton} onClick={loadFriends}>Friends👤</button>
            <button className={styles.searchButton} onClick={loadFriendRequests}>Friend requests🤝</button>
            <button className={styles.searchButton}>Notifications🔔</button>
            <div className={styles.chatContainer}>
                {chats}
                {groups}
                {channels}
            </div>
        </div>
    )
}

export default Main;