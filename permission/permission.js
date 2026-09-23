(() => {
  "use strict";

  const RELEASE_VERSION = "CBK-REL-2026.09.18-01";
  const EXTENDED_SCOPE = "This event/session and future Captured by Karmen photography through an expiration date";

  const form = document.querySelector("#release-form");
  const reviewButton = form?.querySelector(".button-primary");
  const selectAll = document.querySelector("#select-all");
  const permissionInputs = [...document.querySelectorAll('input[name="permissions"]')];
  const scopeInputs = [...document.querySelectorAll('input[name="scope"]')];
  const expirationField = document.querySelector("#expiration-field");
  const expirationInput = document.querySelector("#expiration-date");
  const reviewSummary = document.querySelector("#review-summary");
  const submissionDate = document.querySelector("#submission-date");
  const summaryExpirationRow = document.querySelector("#summary-expiration-row");
  const submitReleaseButton = document.querySelector("#submit-release-button");
  const editReleaseButton = document.querySelector("#edit-release-button");

  if (!form || !reviewButton || !reviewSummary || !submitReleaseButton) return;

  const submitUrl = form.dataset.submitUrl || "";
  const validSubmitUrl = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(submitUrl);

  let formStartedAt = new Date().toISOString();
  let submissionId = createUuidV4();
  let reviewed = false;

  const today = new Date();
  const todayParts = {
    year: today.getFullYear(),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0")
  };
  const todayIso = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(today);
  const maxExpirationIso = addMonthsIso(todayIso, 12);

  submissionDate.textContent = todayLabel;
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const tomorrowIso = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0")
  ].join("-");

  if (expirationInput) {
    expirationInput.min = tomorrowIso;
    expirationInput.max = maxExpirationIso;
  }

  function createUuidV4() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    if (!globalThis.crypto?.getRandomValues) return "";
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  function addMonthsIso(isoDate, months) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const first = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return [
      first.getUTCFullYear(),
      String(first.getUTCMonth() + 1).padStart(2, "0"),
      String(Math.min(day, lastDay)).padStart(2, "0")
    ].join("-");
  }

  const fieldByName = (name) => form.elements.namedItem(name);
  const checkedValue = (name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  };
  const valueOf = (name) => {
    const field = fieldByName(name);
    return field && "value" in field ? field.value.trim() : "";
  };
  const rawValueOf = (name) => {
    const field = fieldByName(name);
    return field && "value" in field ? field.value : "";
  };

  const setError = (field, errorId, message) => {
    const error = document.querySelector(`#${errorId}`);
    if (error) error.textContent = message;
    if (field instanceof Element) field.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const clearErrors = () => {
    form.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.setAttribute("aria-invalid", "false");
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(year, month - 1, day));
  };

  const invalidateReview = () => {
    reviewed = false;
    reviewSummary.hidden = true;
  };

  const updateSelectAllState = () => {
    if (!selectAll) return;
    const checkedCount = permissionInputs.filter((input) => input.checked).length;
    selectAll.checked = checkedCount === permissionInputs.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < permissionInputs.length;
  };

  const updateScope = () => {
    if (!expirationField || !expirationInput) return;
    const isExtended = checkedValue("scope") === EXTENDED_SCOPE;
    expirationField.hidden = !isExtended;
    expirationInput.required = isExtended;
    if (!isExtended) {
      expirationInput.value = "";
      setError(expirationInput, "expiration-date-error", "");
    }
  };

  selectAll?.addEventListener("change", () => {
    permissionInputs.forEach((input) => {
      input.checked = selectAll.checked;
    });
    selectAll.indeterminate = false;
    setError(permissionInputs[0], "permissions-error", "");
  });

  permissionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      updateSelectAllState();
      if (permissionInputs.some((permission) => permission.checked)) {
        setError(permissionInputs[0], "permissions-error", "");
      }
    });
  });

  scopeInputs.forEach((input) => input.addEventListener("change", updateScope));

  const validate = () => {
    clearErrors();
    const errors = [];

    const requireText = (name, errorId, label, minimum = 1) => {
      const field = fieldByName(name);
      if (valueOf(name).length < minimum) {
        const message = `Enter ${label}.`;
        setError(field, errorId, message);
        errors.push(field);
      }
    };

    requireText("guardianName", "guardian-name-error", "the adult signer’s full name", 2);

    const email = fieldByName("guardianEmail");
    if (!valueOf("guardianEmail")) {
      setError(email, "guardian-email-error", "Enter the adult signer’s email address.");
      errors.push(email);
    } else if (email instanceof HTMLInputElement && !email.validity.valid) {
      setError(email, "guardian-email-error", "Enter a valid email address.");
      errors.push(email);
    }

    const relationship = fieldByName("relationship");
    if (!checkedValue("relationship")) {
      const first = relationship instanceof RadioNodeList ? relationship[0] : relationship;
      setError(first, "relationship-error", "Select the signer’s relationship to the child.");
      errors.push(first);
    }

    requireText("childName", "child-name-error", "the child’s full name", 2);
    requireText("eventName", "event-name-error", "the event or session", 2);
    requireText("eventDate", "event-date-error", "the event or session date");

    if (!permissionInputs.some((input) => input.checked)) {
      setError(permissionInputs[0], "permissions-error", "Select at least one permitted use.");
      errors.push(permissionInputs[0]);
    }

    const scope = fieldByName("scope");
    if (!checkedValue("scope")) {
      const first = scope instanceof RadioNodeList ? scope[0] : scope;
      setError(first, "scope-error", "Select how long this permission should apply.");
      errors.push(first);
    }

    if (checkedValue("scope") === EXTENDED_SCOPE) {
      if (!valueOf("expirationDate")) {
        setError(expirationInput, "expiration-date-error", "Choose an expiration date.");
        errors.push(expirationInput);
      } else if (valueOf("expirationDate") <= todayIso) {
        setError(expirationInput, "expiration-date-error", "Choose an expiration date after today.");
        errors.push(expirationInput);
      } else if (valueOf("expirationDate") > maxExpirationIso) {
        setError(expirationInput, "expiration-date-error", "Choose a date no more than 12 months from today.");
        errors.push(expirationInput);
      }
    }

    const agreement = fieldByName("electronicAgreement");
    if (agreement instanceof HTMLInputElement && !agreement.checked) {
      setError(agreement, "electronic-agreement-error", "Agree to this release and electronic signature to continue.");
      errors.push(agreement);
    }

    requireText("typedSignature", "typed-signature-error", "the typed signature", 2);

    if (!submissionId) errors.push(form);
    return errors;
  };

  const writeSummary = () => {
    const permissions = permissionInputs.filter((input) => input.checked).map((input) => input.value);
    const scope = checkedValue("scope");
    const expiration = valueOf("expirationDate");

    const summaryValues = {
      "summary-guardian": valueOf("guardianName"),
      "summary-email": valueOf("guardianEmail"),
      "summary-relationship": checkedValue("relationship"),
      "summary-child": valueOf("childName"),
      "summary-event": valueOf("eventName"),
      "summary-event-date": formatDate(valueOf("eventDate")),
      "summary-permissions": permissions.join(", "),
      "summary-scope": scope,
      "summary-expiration": formatDate(expiration),
      "summary-signature": valueOf("typedSignature"),
      "summary-date": todayLabel
    };

    Object.entries(summaryValues).forEach(([id, value]) => {
      const target = document.querySelector(`#${id}`);
      if (target) target.textContent = value;
    });
    if (summaryExpirationRow) summaryExpirationRow.hidden = !expiration;
  };

  const buildRequestPayload = () => {
    const permissions = new Set(permissionInputs.filter((input) => input.checked).map((input) => input.value));
    const extended = checkedValue("scope") === EXTENDED_SCOPE;
    const agreement = fieldByName("electronicAgreement");

    return {
      submission_id: submissionId,
      release_version: RELEASE_VERSION,
      parent_guardian_name: valueOf("guardianName"),
      parent_guardian_email: valueOf("guardianEmail"),
      relationship: checkedValue("relationship"),
      child_name: valueOf("childName"),
      event_session: valueOf("eventName"),
      event_session_date: valueOf("eventDate"),
      permissions: {
        website: permissions.has("Website Portfolio"),
        social: permissions.has("Organic Social Media"),
        print: permissions.has("Printed Promotional Material"),
        paid_advertising: permissions.has("Paid Advertising")
      },
      scope_type: extended ? "THROUGH_DATE" : "EVENT_ONLY",
      expiration_date: extended ? valueOf("expirationDate") : null,
      electronic_signature_consent: agreement instanceof HTMLInputElement && agreement.checked,
      typed_signature: valueOf("typedSignature"),
      anti_abuse: {
        form_started_at: formStartedAt,
        website: rawValueOf("website")
      }
    };
  };

  reviewButton.addEventListener("click", () => {
    const errors = validate();
    if (errors.length > 0) {
      invalidateReview();
      const firstError = errors.find((field) => field instanceof HTMLElement);
      firstError?.focus();
      return;
    }

    writeSummary();
    reviewed = true;
    reviewSummary.hidden = false;
    reviewSummary.focus();
  });

  submitReleaseButton.addEventListener("click", () => {
    if (!reviewed || reviewSummary.hidden) return;

    const errors = validate();
    if (errors.length > 0) {
      invalidateReview();
      const firstError = errors.find((field) => field instanceof HTMLElement);
      firstError?.focus();
      return;
    }

    if (!validSubmitUrl) {
      submitReleaseButton.textContent = "Submission unavailable";
      submitReleaseButton.disabled = true;
      return;
    }

    const payloadJson = JSON.stringify(buildRequestPayload());
    if (new TextEncoder().encode(payloadJson).length > 16384) {
      submitReleaseButton.textContent = "Submission too large";
      submitReleaseButton.disabled = true;
      return;
    }

    submitReleaseButton.disabled = true;
    submitReleaseButton.textContent = "Submitting…";

    const transport = document.createElement("form");
    transport.method = "POST";
    transport.action = submitUrl;
    transport.acceptCharset = "UTF-8";
    transport.hidden = true;

    const payloadField = document.createElement("input");
    payloadField.type = "hidden";
    payloadField.name = "payload";
    payloadField.value = payloadJson;
    transport.append(payloadField);

    document.body.append(transport);
    transport.submit();
  });

  editReleaseButton?.addEventListener("click", () => {
    invalidateReview();
    form.scrollIntoView({ block: "start" });
    fieldByName("guardianName")?.focus?.();
  });

  form.addEventListener("input", invalidateReview);
  form.addEventListener("change", invalidateReview);

  form.addEventListener("reset", () => {
    // Wait for the native reset to restore values before reading the scope and choices.
    // A microtask can run before that default action when Clear Form is clicked.
    setTimeout(() => {
      clearErrors();
      updateSelectAllState();
      updateScope();
      invalidateReview();
      formStartedAt = new Date().toISOString();
      submissionId = createUuidV4();
      if (summaryExpirationRow) summaryExpirationRow.hidden = true;
    }, 0);
  });
})();
