const formContainer = document.getElementById('form-container');
const showRegisterLink = document.getElementById('show-register');

if (showRegisterLink && formContainer) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderRegisterForm();
    });
}

function renderRegisterForm() {
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

    const showLoginLink = document.getElementById('show-login');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderLoginForm();
        });
    }
}

function renderLoginForm() {
    formContainer.innerHTML = `
        <h2>Login</h2>
        <form id="login-form">
            <input type="email" placeholder="Email" required>
            <input type="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <div class="toggle-link">
            <p>Don't have an account? <a href="#" id="show-register">Register</a></p>
        </div>
    `;

    const showRegisterLink = document.getElementById('show-register');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderRegisterForm();
        });
    }
}