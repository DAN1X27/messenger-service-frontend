import Main from "./Main";
import {useEffect, useState} from "react";
import styles from "./css/Authorization.module.css"
import {Helmet} from "react-helmet";

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
      <div>
         <Helmet>
             <body className={styles.body}/>
         </Helmet>
        <form style={{paddingTop: "200px"}} onSubmit={(event) => sendCode(event)}>
            <label style={{fontSize: "40px", marginBottom: "20px"}} htmlFor="code">Enter the key that was sent to your email</label>
            <div></div>
            <input className={styles.input} type="number" name={"code"} id="code" placeholder={"Code"}/>
            <div id="error" className={styles.error}>{error}</div>
            <input className={styles.button} type={"submit"} id="send" value="Send"/>
        </form>
      </div>
    )
}
export default RegistrationCode;