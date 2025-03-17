import {useEffect, useState} from "react";
import Login from "./Login";
import styles from "./css/Authorization.module.css"
import {Helmet} from "react-helmet";

function RecoverPassword() {
    const [error, setError] = useState({})
    const [data, setData] = useState({})
    const [isComplete, setComplete] = useState(false)
    const sendCodeToUser = async (e) => {
        e.preventDefault()
        const form = e.target
        const email = form.email.value
        const newPassword = form.password.value
        if (!validateSubmit(email, newPassword)) return;
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/auth/password?email=${email}`
            const response = await fetch(URL, {
                method : "POST",
                headers: {"Content-Type": "application/json"}
            })
            if (!response.ok) {
                const data = await response.json()
                setError({global: data.message})
            } else {
                setData({email: email, password: newPassword})
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }
    const sendCodeToServer = async (e) => {
        e.preventDefault()
        const form = e.target
        const code = form.code.value
        if (code === '') {
            setError({code: "Code is required"})
            return
        }
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/auth/password`
            const response = await fetch(URL, {
                body: JSON.stringify({
                    email: data.email,
                    key: code,
                    new_password: data.password
                }),
                method: "PATCH",
                headers: {"Content-Type": "application/json"}
            })
            if (!response.ok) {
                const data = await response.json()
                setError({global: data.message})
            } else {
                setComplete(true)
            }
        } catch (error) {
            setError(process.env.REACT_APP_CONNECTION_ERROR)
        }
    }
    const validateSubmit = (email, password) => {
        const newError = {}
        if (email === "") {
            newError.email = "Email is required"
        }
        if (password === "") {
            newError.password = "New password is required"
        }
        setError(newError)
        return Object.keys(newError).length === 0
    }
    if (!data.email) {
        return (
          <div>
              <Helmet>
                  <body className={styles.body}/>
              </Helmet>
              <form style={{paddingTop: "200px"}} onSubmit={(e) => sendCodeToUser(e)}>
                <div style={{fontSize : "40px", marginBottom: "10px"}}>Enter your email and new password</div>
                <div></div>
                <input className={styles.input} type={"text"} name={"email"} id={"email"} placeholder={"Email"}/>
                <div className={styles.error}>{error.email}</div>
                <input className={styles.input} type={"password"} name={"password"} id={"password"} placeholder={"New password"}/>
                <div className={styles.error}>{error.password}</div>
                <input className={styles.button} type={"submit"} value={"Complete"}/>
                <div className={styles.error}>{error.global}</div>
            </form>
          </div>
        )
    } else if (!isComplete) {
        return (
          <div>
              <Helmet>
                  <body className={styles.body}/>
              </Helmet>
              <form style={{paddingTop: "200px"}} onSubmit={(e) => sendCodeToServer(e)}>
                <label style={{fontSize: "40px", marginBottom: "20px"}} htmlFor={"code"}>Enter the key that was sent to your email</label>
                <div></div>
                <input className={styles.input} type={"number"} id={"code"} name={"code"} placeholder={"Code"}/>
                <div className={styles.error}>{error.code}</div>
                <input className={styles.button} type={"submit"} value={"Send"}/>
                <div className={styles.error}>{error.global}</div>
            </form>
          </div>
        )
    }
    return <Login/>
}
export default RecoverPassword;