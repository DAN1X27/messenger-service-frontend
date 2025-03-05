import React, { useState } from "react";
import Registration from "./Registration";
import Main from "./Main";
import "./css/authorization.css"
import RecoverPassword from "./RecoverPassword";

function Login() {
    const [page, setPage] = useState("login");
    const [error, setError] = useState({});

    const login = async (event) => {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;
        if (validateSubmit(email, password)) {
            try {
                const URL = `${process.env.REACT_APP_SERVER_ADDRESS}/auth/login`;
                const response = await fetch(URL, {
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    }),
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await response.json();
                if (!response.ok) {
                    setError({global: data.message.replaceAll(";", "")})
                } else {
                    let token = data["jwt-token"];
                    localStorage.setItem("jwt-token", token);
                    setPage("main");
                }
            } catch (error) {
                setError({global: process.env.REACT_APP_CONNECTION_ERROR})
            }
        }
    };

    function validateSubmit(email, password) {
        const newError = {};
        if (email === '') {
            newError.email = "Email is required";
        }
        if (password === '') {
            newError.password = "Password is required";
        }
        setError(newError)
        return Object.keys(newError).length === 0;
    }

    // eslint-disable-next-line default-case
    switch (page) {
        case "main":
            return <Main/>
        case "registration":
            return <Registration/>
        case "recover-password":
            return <RecoverPassword/>
    }

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={login}>
                <input type="text" name="email" id="email" placeholder={"Email"}/>
                <div className={"error"}>{error.email}</div>
                <input type="password" name="password" id="password" placeholder={"Password"}/>
                <div className={"error"}>{error.password}</div>
                <input className={"button"} type="submit" name="login-button" value="Login"/>
                <div></div>
                <input className={"button"} type="button" name="registration-button" value="Registration" onClick={() => setPage("registration")}/>
                <div></div>
                <input className={"button"} type={"button"} value={"Forgot password"} onClick={() => setPage("recover-password")}/>
                <div className={"error"}>{error.global}</div>
            </form>
        </div>
    );
}

export default Login;
