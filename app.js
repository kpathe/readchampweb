const loginForm = document.getElementById('loginForm');
const trackForm = document.getElementById('trackForm');
const registerForm = document.getElementById('registerForm');
const trackerDiv = document.getElementById('tracker');
const authDiv = document.getElementById('auth');
const loginError = document.getElementById('loginError');
const trackerError = document.getElementById('trackerError');
const entriesList = document.getElementById('entriesList');
const regError = document.getElementById('regError');
const logoutButton = document.getElementById('logoutButton');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            regError.textContent = result.message;
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (result.success) {
            authDiv.style.display = 'none';
            trackerDiv.style.display = 'block';
            loadEntries();
        } else {
            loginError.textContent = result.message;
        }
    });
}

if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookTitle = document.getElementById('bookTitle').value;
        const pagesRead = document.getElementById('pagesRead').value;
        const readingDate = document.getElementById('readingDate').value;

        const response = await fetch('/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bookTitle, pagesRead, readingDate })
        });

        const result = await response.json();
        if (result.success) {
            loadEntries();
        } else {
            trackerError.textContent = result.message;
        }
    });
}

async function loadEntries() {
    const response = await fetch('/entries');
    const entries = await response.json();
    entriesList.innerHTML = '';
    entries.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.readingDate}: ${entry.bookTitle} - ${entry.pagesRead} pages`;
        entriesList.appendChild(li);
    });
}

// Logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await fetch('/logout');
        window.location.href = 'dashboard.html';
    });
}
