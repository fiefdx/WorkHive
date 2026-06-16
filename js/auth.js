/**
 * WorkHive - Authentication Module (Phase 2)
 * 
 * Phase 2: Uses backend API with JWT tokens and bcrypt password hashing
 */

// VALIDATION FUNCTIONS
function validateName(name) {
  return name && name.trim().length > 0;
}

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(phone.trim());
}

function validateRole(role) {
  return role === 'owner' || role === 'coworker';
}

function validatePassword(password) {
  return password && password.length >= 6;
}

/**
 * REGISTRATION HANDLER
 * Uses backend API for registration
 */
async function handleRegistration(userData) {
  const { firstName, middleName, lastName, email, phone, role, password } = userData;
  
  // Client-side validation
  if (!validateName(firstName)) {
    return { success: false, message: 'First name is required.', user: null };
  }
  if (!validateName(lastName)) {
    return { success: false, message: 'Last name is required.', user: null };
  }
  if (!validateEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.', user: null };
  }
  if (!validatePhone(phone)) {
    return { success: false, message: 'Phone number must be 10-15 digits.', user: null };
  }
  if (!validateRole(role)) {
    return { success: false, message: 'Please select a valid role (owner or coworker).', user: null };
  }
  if (!validatePassword(password)) {
    return { success: false, message: 'Password must be at least 6 characters.', user: null };
  }
  
  // Call backend API
  const result = await apiRegister({
    firstName,
    middleName: middleName || '',
    lastName,
    email,
    phone,
    password,
    role
  });
  
  if (result.success) {
    // Token and user are already stored by apiRegister()
    return { success: true, message: 'Account created successfully! Welcome to WorkHive.', user: result.data.user };
  } else {
    return { success: false, message: result.message, user: null };
  }
}

/**
 * LOGIN HANDLER
 * Uses backend API for authentication with JWT
 */
async function handleLogin(loginData) {
  const { email, password } = loginData;
  
  // Validate input
  if (!email || !password) {
    return { success: false, message: 'Please enter both email and password.', user: null };
  }
  
  if (!validateEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.', user: null };
  }
  
  // Call backend API
  const result = await apiLogin({ email, password });
  
  if (result.success) {
    return { 
      success: true, 
      message: 'Login successful!', 
      user: result.data.user
    };
  } else {
    return { success: false, message: result.message, user: null };
  }
}

/**
 * LOGOUT HANDLER
 */
async function handleLogout() {
  // Call backend API to logout
  await apiLogout();
  
  // Clear local storage
  clearCurrentUser();
  
  // Redirect to landing page
  const path = window.location.pathname;
  const segments = path.split('/').filter(s => s && s !== '');
  
  let workhiveIndex = segments.indexOf('WorkHive');
  if (workhiveIndex === -1) {
    window.location.href = '../../index.html';
    return;
  }
  
  const levelsToGoUp = segments.length - workhiveIndex - 2;
  let upPath = '';
  for (let i = 0; i < levelsToGoUp; i++) {
    upPath += '../';
  }
  window.location.href = upPath + 'index.html';
}

// CHECK IF USER IS LOGGED IN
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// GET CURRENT USER ROLE
function getCurrentUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

/**
 * REQUIRE LOGIN - Redirect if not logged in
 */
function requireLogin(redirectUrl = '../auth/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

/**
 * REQUIRE ROLE - Redirect if user doesn't have required role
 */
function requireRole(requiredRole, redirectUrl) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../auth/login.html';
    return false;
  }
  if (user.role !== requiredRole) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

/**
 * SETUP NAVIGATION BASED ON USER ROLE
 */
function setupRoleBasedNavigation() {
  const user = getCurrentUser();
  const navContainer = document.querySelector('.main-nav');
  
  if (!navContainer) return;
  
  const existingLinks = navContainer.querySelectorAll('a');
  let hasCorrectLinks = false;
  
  if (existingLinks.length > 0) {
    const hrefs = Array.from(existingLinks).map(a => a.href);
    hasCorrectLinks = hrefs.some(h => h.includes('search.html') || 
                                       h.includes('dashboard.html') || 
                                       h.includes('properties/create.html') ||
                                       h.includes('login.html'));
  }
  
  if (hasCorrectLinks) {
    const greetingEl = navContainer.querySelector('.user-greeting');
    if (greetingEl && user) {
      greetingEl.textContent = `Welcome, ${user.firstName}`;
    }
    
    const logoutLinks = navContainer.querySelectorAll('a');
    logoutLinks.forEach(link => {
      const text = link.textContent.trim();
      if (text === 'Log Out' && !link.getAttribute('onclick')) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          handleLogout();
        });
      }
    });
    
    return;
  }
  
  if (!user) {
    navContainer.innerHTML = `
      <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="login.html">Log In</a></li>
        <li><a href="register.html">Sign Up</a></li>
      </ul>
    `;
  } else if (user.role === 'owner') {
    navContainer.innerHTML = `
      <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="dashboard.html">My Dashboard</a></li>
        <li><a href="properties/create.html">Add Property</a></li>
        <li><span class="user-greeting">Welcome, ${user.firstName}</span></li>
        <li><a href="#" onclick="handleLogout(); return false;">Log Out</a></li>
      </ul>
    `;
  } else if (user.role === 'coworker') {
    navContainer.innerHTML = `
      <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="search.html">Search Workspaces</a></li>
        <li><span class="user-greeting">Welcome, ${user.firstName}</span></li>
        <li><a href="#" onclick="handleLogout(); return false;">Log Out</a></li>
      </ul>
    `;
  }
}

/**
 * REGISTER FORM SUBMIT HANDLER
 */
function setupRegistrationForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const userData = {
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || '',
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: formData.get('role') || 'coworker',
      password: formData.get('password')
    };
    
    const result = await handleRegistration(userData);
    
    if (result.success) {
      showMessage(result.message, 'success');
      setTimeout(() => {
        if (userData.role === 'owner') {
          window.location.href = '../owner/dashboard.html';
        } else {
          window.location.href = '../coworker/search.html';
        }
      }, 1500);
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * LOGIN FORM SUBMIT HANDLER
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const loginData = {
      email: formData.get('email'),
      password: formData.get('password')
    };
    
    const result = await handleLogin(loginData);
    
    if (result.success) {
      showMessage(result.message, 'success');
      setTimeout(() => {
        if (result.user.role === 'owner') {
          window.location.href = '../owner/dashboard.html';
        } else {
          window.location.href = '../coworker/search.html';
        }
      }, 1000);
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * SHOW MESSAGE HELPER
 */
function showMessage(message, type) {
  const messageEl = document.getElementById('loginMessage') || 
                    document.getElementById('registerMessage') ||
                    document.getElementById('propertyMessage') ||
                    document.getElementById('workspaceMessage') ||
                    document.getElementById('dashboardMessage');
  
  if (messageEl) {
    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  setupRoleBasedNavigation();
  setupRegistrationForm();
  setupLoginForm();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleRegistration,
    handleLogin,
    handleLogout,
    isLoggedIn,
    getCurrentUserRole,
    requireLogin,
    requireRole,
    setupRoleBasedNavigation,
    setupRegistrationForm,
    setupLoginForm,
    showMessage,
    validateEmail,
    validatePhone,
    validateName
  };
}
