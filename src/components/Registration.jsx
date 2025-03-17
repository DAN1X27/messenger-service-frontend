import RegistrationCode from "./RegistrationCode";
import React, {useEffect, useState} from "react";
import styles from "./css/Authorization.module.css"
import {Helmet} from "react-helmet";

function Registration() {
    const [isRegistered, setRegistered] = useState(false)
    const [error, setError] = useState({})
    async function registration(event) {
        event.preventDefault()
        const form = event.target
        const username = form.username.value
        const email = form.email.value
        const password = form.password.value
        const repeatPassword = form["repeat-password"].value
        if (validateSubmit(username, email, password, repeatPassword)) {
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/auth/registration`;
                const response = await fetch(URL, {
                    method: "POST",
                    body: JSON.stringify({
                        email: email,
                        username: username,
                        password: password
                    }),
                    headers: {"Content-Type": "application/json"}
                });
                if (!response.ok) {
                    const data = await response.json()
                    setError({global: data.message.replaceAll(";", "")})
                } else {
                    localStorage.setItem("email", email)
                    setRegistered(true)
                }
            } catch (error) {
                setError({global: process.env.REACT_APP_CONNECTION_ERROR})
            }
        }
    }
    function validateSubmit(username ,email, password, repeatPassword) {
        const newError = {}
        if (email === '') {
            newError.email = "Email is required"
        }
        if (username === '') {
            newError.username = 'Username is required'
        }
        if (password === '') {
            newError.password = 'Password is required'
        }
        if (repeatPassword === '') {
            newError.repeatPassword = 'Repeat password is required'
        } else if (repeatPassword !== password) {
            newError.repeatPassword = "Passwords don't match"
        }
        setError(newError)
        return Object.keys(newError).length === 0
    }
    if (isRegistered) {
        return <RegistrationCode/>;
    }
    return (
        <div>
            <Helmet>
                <body className={styles.body}/>
            </Helmet>
            <h1>Registration</h1>
            <form onSubmit={(event) => registration(event)}>
                <input className={styles.input} type="text" name="email" id="email" placeholder={"Email"}/>
                <div className={styles.error}>{error.email}</div>
                <input className={styles.input} type="text" name="username" id="username" placeholder={"Username"}/>
                <div className={styles.error}>{error.username}</div>
                <input className={styles.input} type="password" name="password" id="password" placeholder={"Password"}/>
                <div className={styles.error}>{error.password}</div>
                <input className={styles.input} type={"password"} name={"repeat-password"} placeholder={"Repeat password"}/>
                <div className={styles.error}>{error.repeatPassword}</div>
                <input id="registration" className={styles.button} type="submit" value="Registration"/>
                <div className={styles.error}>{error.global}</div>
            </form>
        </div>
    );
}
export default Registration;