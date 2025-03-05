import Main from "./Main";
import {useState} from "react";
import "./css/authorization.css"

function RegistrationCode() {
    const [isSent, setSent] = useState(false)
    const [error, setError] = useState("")
    async function sendCode(event) {
        event.preventDefault();
        const key = event.target.code.value;
        if (key === '') {
            setError("Key is required");
            return;
        }
        const email = localStorage.getItem("email");
        const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/auth/registration/accept`;
        try {
            const response = await fetch(URL, {
                body: JSON.stringify({
                    email: email,
                    key: key
                }),
                method: "PATCH",
                headers: {"Content-Type": "application/json"}
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message)
            } else {
                localStorage.removeItem("email");
                localStorage.setItem("jwt-token", data["jwt-token"]);
                setSent(true)
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }
    if (isSent) return <Main/>
    return (
        <form style={{paddingTop: "200px"}} onSubmit={(event) => sendCode(event)}>
            <label style={{fontSize: "40px", marginBottom: "20px"}} htmlFor="code">Enter the key that was sent to your email</label>
            <div></div>
            <input type="number" name={"code"} id="code" placeholder={"Code"}/>
            <div id="error" className="error">{error}</div>
            <input className={"button"} type="submit" id="send" value="Send"/>
        </form>
)
}
export default RegistrationCode;