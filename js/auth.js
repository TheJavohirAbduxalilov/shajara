/* ========================================
   AUTH PAGES JAVASCRIPT
   Shajara - Family Tree App
   ======================================== */

const API_BASE = 'api';

function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function apiRequest(endpoint, method, data) {
    const options = {
        method,
        headers: getAuthHeaders()
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, options);
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Request failed');
    }
    return result;
}

async function loginUser(login, password) {
    return apiRequest('auth/login.php', 'POST', { login, password });
}

async function registerUser(username, email, password) {
    return apiRequest('auth/register.php', 'POST', { username, email, password });
}

async function checkAuth() {
    const response = await fetch(`${API_BASE}/auth/check.php`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return response.json();
}

function showFormError(form, message) {
    let errorEl = form.querySelector('.auth-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'form-error auth-error';
        form.insertBefore(errorEl, form.firstChild);
    }
    errorEl.textContent = message;
}

function clearFormError(form) {
    const errorEl = form.querySelector('.auth-error');
    if (errorEl) {
        errorEl.remove();
    }
}

function initAuthHandlers() {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormError(form);

        let isValid = true;
        // Найти все поля с меткой required (span.required в label)
        const requiredFields = form.querySelectorAll('.form-field:has(.required)');

        requiredFields.forEach(field => {
            const step = field.closest('.form-step');
            if (step && !step.classList.contains('form-step--active')) {
                return;
            }
            const input = field.querySelector('.form-input');
            if (input && !validateInput(input)) {
                isValid = false;
            }
        });

        const password = form.querySelector('#regPassword');
        const confirm = form.querySelector('#regPasswordConfirm');
        if (password && confirm && password.value !== confirm.value) {
            showError(confirm, 'Пароли не совпадают');
            isValid = false;
        }

        if (!isValid) return;

        const isRegister = !!form.querySelector('#regPassword');
        try {
            if (isRegister) {
                const username = form.querySelector('input[name="username"]').value.trim();
                const email = form.querySelector('input[name="email"]').value.trim();
                const passwordValue = form.querySelector('input[name="password"]').value;

                const result = await registerUser(username, email, passwordValue);
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                window.location.href = 'index.html';
            } else {
                const login = form.querySelector('input[name="username"]').value.trim();
                const passwordValue = form.querySelector('input[name="password"]').value;

                const result = await loginUser(login, passwordValue);
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                window.location.href = 'index.html';
            }
        } catch (error) {
            showFormError(form, error.message || 'Ошибка авторизации');
        }
    });
}

async function redirectIfAuthenticated() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const result = await checkAuth();
        if (result.success && result.data.authenticated) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        // ignore invalid token
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTogglePassword();
    initRegisterSteps();
    initPasswordStrength();
    initPasswordMatch();
    initFormValidation();
    initAuthHandlers();
    redirectIfAuthenticated();
});

/* ========================================
   TOGGLE PASSWORD VISIBILITY
   ======================================== */

function initTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.input-wrapper');
            const input = wrapper.querySelector('.form-input');

            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('active');
            } else {
                input.type = 'password';
                btn.classList.remove('active');
            }
        });
    });
}

/* ========================================
   REGISTER MULTI-STEP FORM
   ======================================== */

function initRegisterSteps() {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    document.querySelectorAll('.auth-btn--next').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-step');
            const nextStepNum = btn.dataset.next;

            if (!validateStep(currentStep)) {
                return;
            }

            goToStep(nextStepNum);
        });
    });

    document.querySelectorAll('.auth-btn--back').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStepNum = btn.dataset.back;
            goToStep(prevStepNum);
        });
    });
}

function goToStep(stepNum) {
    document.querySelectorAll('.step').forEach(step => {
        const num = step.dataset.step;
        step.classList.remove('step--active', 'step--completed');

        if (num < stepNum) {
            step.classList.add('step--completed');
        } else if (num == stepNum) {
            step.classList.add('step--active');
        }
    });

    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('form-step--active');
        if (step.dataset.step == stepNum) {
            step.classList.add('form-step--active');
        }
    });
}

function validateStep(stepEl) {
    let isValid = true;
    // Найти все поля с меткой required (span.required в label)
    const requiredFields = stepEl.querySelectorAll('.form-field:has(.required)');

    requiredFields.forEach(field => {
        const input = field.querySelector('.form-input');
        if (input && !validateInput(input)) {
            isValid = false;
        }
    });

    return isValid;
}

/* ========================================
   PASSWORD STRENGTH INDICATOR
   ======================================== */

function initPasswordStrength() {
    const passwordInput = document.getElementById('regPassword');
    if (!passwordInput) return;

    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    if (!strengthFill || !strengthText) return;

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);

        strengthFill.setAttribute('data-strength', strength.level);
        strengthText.setAttribute('data-strength', strength.level);
        strengthText.textContent = strength.text;
    });
}

function calculatePasswordStrength(password) {
    if (!password) {
        return { level: '', text: 'Надёжность пароля' };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
        return { level: 'weak', text: 'Слабый пароль' };
    } else if (score <= 3) {
        return { level: 'fair', text: 'Нормальный пароль' };
    } else if (score <= 4) {
        return { level: 'good', text: 'Хороший пароль' };
    }
    return { level: 'strong', text: 'Надёжный пароль' };
}

/* ========================================
   PASSWORD MATCH VALIDATION
   ======================================== */

function initPasswordMatch() {
    const password = document.getElementById('regPassword');
    const confirm = document.getElementById('regPasswordConfirm');
    const matchText = document.querySelector('.password-match');

    if (!password || !confirm || !matchText) return;

    function checkMatch() {
        const pass = password.value;
        const conf = confirm.value;

        if (!conf) {
            matchText.textContent = '';
            matchText.className = 'password-match';
            return;
        }

        if (pass === conf) {
            matchText.textContent = 'Пароли совпадают';
            matchText.className = 'password-match password-match--match';
        } else {
            matchText.textContent = 'Пароли не совпадают';
            matchText.className = 'password-match password-match--mismatch';
        }
    }

    password.addEventListener('input', checkMatch);
    confirm.addEventListener('input', checkMatch);
}

/* ========================================
   FORM VALIDATION
   ======================================== */

function initFormValidation() {
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            if (input.classList.contains('form-input--error')) {
                clearError(input);
            }
        });
    });
}

function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;

    // Проверить обязательность через span.required в label
    const field = input.closest('.form-field');
    const hasRequired = field?.querySelector('.required');

    if (hasRequired && !value) {
        showError(input, 'Обязательное поле');
        return false;
    }

    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showError(input, 'Неверный формат email');
            return false;
        }
    }

    if (name === 'username' && value) {
        if (value.length < 3) {
            showError(input, 'Минимум 3 символа');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            showError(input, 'Только латинские буквы и цифры');
            return false;
        }
    }

    if (name === 'password' && value) {
        if (value.length < 6) {
            showError(input, 'Минимум 6 символов');
            return false;
        }
    }

    clearError(input);
    return true;
}

function showError(input, message) {
    input.classList.add('form-input--error');
    input.classList.remove('form-input--success');

    const existingError = input.closest('.form-field').querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }

    const errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    input.closest('.input-wrapper').insertAdjacentElement('afterend', errorEl);
}

function clearError(input) {
    input.classList.remove('form-input--error');

    const errorEl = input.closest('.form-field').querySelector('.form-error');
    if (errorEl) {
        errorEl.remove();
    }
}
