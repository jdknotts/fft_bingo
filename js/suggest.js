import { GOOGLE_FORM, isGoogleFormConfigured } from './google-form-config.js';

const MAX_LENGTH = 500;

export function initSuggest() {
  const input = document.getElementById('suggest-input');
  const submitBtn = document.getElementById('suggest-submit');
  const feedback = document.getElementById('suggest-feedback');

  if (!isGoogleFormConfigured()) {
    feedback.textContent = 'Suggestion form not configured yet (see README).';
    submitBtn.disabled = true;
    input.disabled = true;
    return;
  }

  submitBtn.addEventListener('click', () => handleSubmit(input, submitBtn, feedback));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(input, submitBtn, feedback);
    }
  });
}

async function handleSubmit(input, submitBtn, feedback) {
  const text = input.value.trim();

  if (!text) {
    setFeedback(feedback, 'Please enter a suggestion first.', 'error');
    return;
  }

  if (text.length > MAX_LENGTH) {
    setFeedback(feedback, `Please keep suggestions under ${MAX_LENGTH} characters.`, 'error');
    return;
  }

  submitBtn.disabled = true;
  input.disabled = true;
  setFeedback(feedback, 'Sending…', '');

  try {
    await submitToGoogleForm(text);
    input.value = '';
    setFeedback(feedback, 'Thanks — suggestion sent!', 'success');
  } catch {
    setFeedback(feedback, 'Could not send. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

function submitToGoogleForm(text) {
  const iframe = document.getElementById('google-form-target');
  const form = document.createElement('form');

  form.action = GOOGLE_FORM.actionUrl;
  form.method = 'POST';
  form.target = iframe.name;
  form.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = GOOGLE_FORM.entryField;
  input.value = text;
  form.appendChild(input);

  document.body.appendChild(form);

  return new Promise((resolve) => {
    const done = () => {
      form.remove();
      resolve();
    };

    iframe.addEventListener('load', done, { once: true });
    form.submit();
    setTimeout(done, 2000);
  });
}

function setFeedback(el, message, type) {
  el.textContent = message;
  el.className = 'suggest-feedback';
  if (type) {
    el.classList.add(`suggest-${type}`);
  }
}
