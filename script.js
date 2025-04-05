const formContainer = document.getElementById('form-container');
const showRegisterLink = document.getElementById('show-register');

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    formContainer.innerHTML = `
        <h2>Register</h2>
        <form id="register-form">
            <input type="text" placeholder="Full Name" required>
            <input type="email" placeholder="Email" required>
            <input type="password" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>
        <div class="toggle-link">
            <p>Already have an account? <a href="#" id="show-login">Login</a></p>
        </div>
    `;

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        location.reload(); // Reload to show the login form again
    });
});