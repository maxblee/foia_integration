function googleLogin(props) {
    return(`
        <div className="login__flex__container">
            <div className="login__container">
                <h2>Sign In</h2>
                <p>
                This application reads through messages in your GMail account, reads your contact list, and sends you messages
        on your behalf. Because of this, it is highly recommended that you only use this GMail account for filing public records requests,
        due to privacy concerns and because using this account for other things might make the application less useful.
                </p>
            </div>
        </div>
    `)
}