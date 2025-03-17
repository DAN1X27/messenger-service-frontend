import {useEffect, useState} from "react";
import Main from "./Main";
import styles from "./css/EditProfile.module.css"
import {Helmet} from "react-helmet";

function UpdatePassword() {
    const [isEdited, setEdited] = useState(false)
    const [error, setError] = useState({})

    async function update(event) {
        event.preventDefault()
        const form = event.target
        const oldPassword = form.oldPassword.value
        const newPassword = form.newPassword.value
        const token = localStorage.getItem("jwt-token")
        if (!validate(oldPassword, newPassword)) return
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/password`
            const response = await fetch(URL, {
                method: "PATCH",
                body: JSON.stringify({
                    password: oldPassword,
                    new_password: newPassword
                }),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization" : `Bearer ${token}`
                }
            })
            if (!response.ok) {
                const data = await response.json()
                setError({global: data.message})
            } else {
                setEdited(true)
            }
        } catch (error) {
            setError({global: process.env.REACT_APP_CONNECTION_ERROR})
        }
    }
    function validate(oldPassword, newPassword) {
        const newError = {}
        if (oldPassword === "") {
            newError.oldPassword = "Old password is required"
        }
        if (newPassword === "") {
            newError.newPassword = "New password is required"
        }
        if (newPassword === oldPassword && Object.keys(newError).length === 0) {
            newError.newPassword = "New password must be different from the old one"
        }
        setError(newError)
        return Object.keys(newError).length === 0;
    }
    if (isEdited) return <Main/>
    return (
        <div>
            <Helmet>
                <body className={styles.body}/>
            </Helmet>
            <form onSubmit={(event) => update(event)}>
                <h1 className={styles.h1}>Update password</h1>
                <input name={"oldPassword"} type={"password"} className={styles.input} placeholder={"Old password"}/>
                <div className={styles.error}>{error.oldPassword}</div>
                <input name={"newPassword"} type={"password"} className={styles.input} placeholder={"New password"}/>
                <div className={styles.error}>{error.newPassword}</div>
                <input type={"submit"} className={styles.button} value={"Submit"}/>
                <div className={styles.error}>{error.global}</div>
            </form>
        </div>
    )
}
export default UpdatePassword;