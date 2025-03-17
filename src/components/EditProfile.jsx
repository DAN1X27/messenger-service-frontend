import {useEffect, useState} from "react";
import Main from "./Main";
import styles from "./css/EditProfile.module.css"
import backButtonStyle from "./css/Main.module.css"
import UpdatePassword from "./UpdatePassword";
import {Helmet} from "react-helmet";

function EditProfile(props) {
    const [isEdited, setEdited] = useState(false)
    const [isPasswordUpdate, setPasswordUpdated] = useState(false)
    const [error, setError] = useState({})
    const image = props.image
    const user = props.user

    async function updateInfo(event) {
        event.preventDefault()
        const form = event.target
        const username = form.username.value
        const status = form.status.checked
        const description = form.description.value
        if (username === "") {
            setError({username: "Username must not be empty"})
            return
        }
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user`
            const token = localStorage.getItem("jwt-token")
            const response = await fetch(URL, {
                method: "PATCH",
                headers: {
                    "Authorization" : `Bearer ${token}`,
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    is_private: status,
                    description: description
                })
            })
            if (!response.ok) {
                const data = await response.json()
                setError({global: data.message})
            } else {
                const image = document.getElementById("fileInput")
                if (image.files.length > 0) {
                    await updateImage(image.files[0])
                }
                setEdited(true)
            }
        } catch (error) {
            setError({global: process.env.REACT_APP_CONNECTION_ERROR})
        }
    }
    async function updateImage(image) {
        try {
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/image`
            const formData = new FormData()
            const token = localStorage.getItem("jwt-token")
            formData.append('image', image)
            const response = await fetch(URL, {
                method: "PATCH",
                body: formData,
                headers: {"Authorization" : `Bearer ${token}`}
            })
            if (!response.ok) {
                let data = await response.json()
                setError({global: data.message})
            }
        } catch (error) {
            setError({global: process.env.REACT_APP_CONNECTION_ERROR})
        }
    }
    async function deleteImage(event) {
        event.preventDefault()
        try {
            const token = localStorage.getItem("jwt-token")
            const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/user/image`
            const response = await fetch(URL, {
                method: "DELETE",
                headers: {"Authorization" : `Bearer ${token}`}
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
    if (isEdited) return <Main updateBody={true}/>
    if (isPasswordUpdate) return <UpdatePassword/>
    return (
        <div>
            <Helmet>
                <body className={styles.body}/>
            </Helmet>
            <button className={backButtonStyle.backButton} onClick={() => setEdited(true)}>⬅</button>
            <form onSubmit={(event) => updateInfo(event)}>
                <div className={styles.imageContainer}>
                    <label htmlFor="fileInput">
                        <img id={"image"} className={styles.image} src={image} alt="Profile"/>
                        <div className={styles.overlay}>
                            <span className={styles.editIcon}>✏️</span>
                        </div>
                    </label>
                    <input type="file" id="fileInput" className={styles.fileInput} accept={"image/*"}/>
                </div>
                <div></div>
                <button className={styles.deleteImageButton} onClick={(event) => deleteImage(event)}>Delete image</button>
                <div></div>
                <label htmlFor={"username"}>Username</label>
                <div></div>
                <input type={"text"} className={styles.input} defaultValue={user.username} id={"username"} name={"username"}/>
                <div className={styles.error}>{error.username}</div>
                <label htmlFor={"description"}>Description</label>
                <div></div>
                <input type={"text"} className={styles.input} defaultValue={user.description} id={"description"} name={"description"}/>
                <div className={styles.error}>{error.description}</div>
                <label htmlFor={"status"}>Private profile</label>
                <input id={"status"} name={"status"} className={styles.statusButton} type={"checkbox"} defaultChecked={user.private}/>
                <div></div>
                <div className={styles.error}>{error.global}</div>
                <input type={"submit"} className={styles.button} value={"Submit"}/>
                <div></div>
                <button className={styles.button} onClick={() => setPasswordUpdated(true)}>Update password</button>
            </form>
        </div>
    )
}
export default EditProfile;