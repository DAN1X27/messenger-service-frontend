import Login from "./Login";

function Main() {
    const token = localStorage.getItem("jwt-token")
    if (token === "undefined" || !token) {
        return <Login/>
    }
    return <h1>Main</h1>
}

export default Main;