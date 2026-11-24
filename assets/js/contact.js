/**
 * Contact form handler for Formsubmit.co
 * Progressive enhancement: form works without JS via redirect
 */
(function() {
  'use strict';

  var form = document.getElementById('contact-form');
  var submitBtn = form.querySelector('button[type="submit"]');
  var statusEl = document.getElementById('form-status');
  var originalBtnText = submitBtn.textContent;

  // Spam protection: record page load time and set JS token
  var pageLoadTime = Date.now();
  var jsTokenField = form.querySelector('input[name="_gotcha"]');
  if (jsTokenField) {
    jsTokenField.value = 'js-enabled';
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Native validation
    if (!form.reportValidity()) {
      return;
    }

    // Spam protection: time trap (< 3 seconds = likely bot)
    var submitTime = Date.now();
    if (submitTime - pageLoadTime < 3000) {
      // Show success silently, don't actually send
      form.innerHTML = '<p class="form-status form-status--success" tabindex="-1">Thank you. Your message has been sent. We will be in touch.</p>';
      form.querySelector('.form-status--success').focus();
      return;
    }

    // Spam protection: JS token must be filled (bots won't run JS)
    if (jsTokenField && jsTokenField.value !== 'js-enabled') {
      form.innerHTML = '<p class="form-status form-status--success" tabindex="-1">Thank you. Your message has been sent. We will be in touch.</p>';
      form.querySelector('.form-status--success').focus();
      return;
    }

    // Disable button and show sending state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.hidden = true;

    // Submit via fetch to AJAX endpoint (form.action is kept for no-JS fallback)
    var formData = new FormData(form);
    formData.delete('_next'); // _next is only for the no-JS redirect path
    formData.delete('_gotcha'); // Don't send the JS token field

    // Set dynamic subject line with sender's name
    var firstName = form.querySelector('#first_name').value.trim();
    var lastName = form.querySelector('#last_name').value.trim();
    formData.set('_subject', 'New website inquiry - ' + firstName + ' ' + lastName);

    // TODO: Replace email with FormSubmit random string when available
    fetch('https://formsubmit.co/ajax/help@langfordramos.com', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(function(response) {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok');
    })
    .then(function(data) {
      // Formsubmit.co returns {"success":"true"} as string
      if (data.success === 'true' || data.success === true) {
        // Success: replace form with message
        form.innerHTML = '<p class="form-status form-status--success" tabindex="-1">Thank you. Your message has been sent. We will be in touch.</p>';
        form.querySelector('.form-status--success').focus();
      } else {
        throw new Error(data.message || 'Form submission failed');
      }
    })
    .catch(function(error) {
      // Error: show message and re-enable button
      console.error('Contact form submission failed:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      statusEl.className = 'form-status form-status--error';
      statusEl.textContent = 'Something went wrong. Please call 801.328.4090 or email help@langfordramos.com.';
      statusEl.hidden = false;
    });
  });
})();
