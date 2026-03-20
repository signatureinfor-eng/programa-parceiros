console.log("App.js loading...");
/**
 * Partner Referral Management System - Core App Logic
 * Handles Authentication, Session, and Navigation
 */

const AUTH_CONFIG = {
    email: "joao@meres.com.br",
    password: "jv667384",
    role: "adm"
};

/**
 * SESSION MANAGEMENT
 */
function checkAuth() {
    const session = sessionStorage.getItem("user_session");
    const path = window.location.pathname.split("/").pop();
    const currentPage = (path === "" || path === "/") ? "index.html" : path;

    // Public pages that don't require authentication
    const publicPages = ["login.html", "indicacao.html", "index.html"];

    // If not logged in and trying to access a protected page
    if (!session && !publicPages.includes(currentPage)) {
        window.location.href = "login.html";
        return;
    }

    // If logged in and on login or index, go to dashboard
    // EXTRA CHECK: If we are in an iframe (like the editor preview), don't redirect index.html
    const isIframe = window.self !== window.top;
    
    if (session && (currentPage === "login.html" || (currentPage === "index.html" && !isIframe))) {
        window.location.href = "dashboard.html";
        return;
    }

    // Role-based access control for Editor
    if (currentPage === "editor.html") {
        if (!session) return; // Handled by check above
        const userData = JSON.parse(session);
        if (userData.role !== "adm") {
            alert("Acesso restrito a administradores.");
            window.location.href = "dashboard.html";
        }
    }
}

function login(email, password) {
    console.log("Login attempt for:", email);
    if (email === AUTH_CONFIG.email && password === AUTH_CONFIG.password) {
        console.log("Login successful!");
        const userData = {
            email: email,
            role: AUTH_CONFIG.role,
            name: "João Meres"
        };
        sessionStorage.setItem("user_session", JSON.stringify(userData));
        console.log("Session saved, redirecting to dashboard...");
        window.location.href = "dashboard.html";
        return true;
    }
    console.log("Login failed: Invalid credentials.");
    return false;
}

function logout() {
    sessionStorage.removeItem("user_session");
    window.location.href = "login.html";
}

/**
 * UI UTILITIES
 */
function highlightActiveNav() {
    const path = window.location.pathname.split("/").pop();
    const currentPage = (path === "" || path === "/") ? "index.html" : path;
    const navItems = document.querySelectorAll(".nav-item");
    
    navItems.forEach(item => {
        const href = item.getAttribute("href");
        if (href === currentPage) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

/**
 * INITIALIZATION
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded - Initializing App");
    // Attempt to run auth check, but don't let it block form listeners if it fails
    try {
        checkAuth();
    } catch (err) {
        console.error("Auth check failed:", err);
    }
    
    try {
        highlightActiveNav();
    } catch (err) {}

    // Handle Login Form - Ensure this always runs
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        console.log("Login form detected, adding submit listener");
        loginForm.addEventListener("submit", (e) => {
            console.log("Login form submitted");
            e.preventDefault();
            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const errorMsg = document.getElementById("loginError");

            if (!emailInput || !passwordInput) {
                console.error("Login inputs missing!");
                return;
            }

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!login(email, password)) {
                if (errorMsg) {
                    errorMsg.textContent = "E-mail ou senha incorretos.";
                    errorMsg.classList.remove("hidden");
                }
            }
        });
    } else {
        console.log("No login form detected on this page.");
    }

    // Handle Logout Button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }
});
