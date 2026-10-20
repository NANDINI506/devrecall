// All input validation rules in one place (mirrors the rules shown on the signup form).

const NAME_RE = /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/; // letters only (spaces, . ' - allowed between words)
const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

// Common disposable / temp-mail domains we do not accept.
const DISPOSABLE = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org","grr.la","10minutemail.com",
  "tempmail.com","temp-mail.org","tempmailo.com","tempmailaddress.com","tempail.com","tempr.email","tempinbox.com",
  "yopmail.com","trashmail.com","throwawaymail.com","getnada.com","sharklasers.com","maildrop.cc","dispostable.com",
  "fakeinbox.com","mintemail.com","mohmal.com","emailondeck.com","discard.email","spamgourmet.com","mytemp.email",
  "moakt.com","tmail.io","burnermail.io","33mail.com","inboxkitten.com","mail.tm","dropmail.me","emailfake.com",
  "fakemailgenerator.com","minuteinbox.com","spambox.us","mailnesia.com","jetable.org","nowmymail.com",
  "mailcatch.com","mailforspam.com","anonbox.net","trbvm.com",
]);

function validateSignup({ name, email, password }) {
  const errors = {};
  const n = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const e = typeof email === "string" ? email.trim().toLowerCase() : "";
  const p = typeof password === "string" ? password : "";

  if (!n) errors.name = "Full name is required";
  else if (n.length < 2 || n.length > 80) errors.name = "Name must be 2 to 80 characters";
  else if (!NAME_RE.test(n)) errors.name = "Name can contain letters only";

  if (!e) errors.email = "Email is required";
  else if (!EMAIL_RE.test(e)) errors.email = "Enter a valid email address";
  else if (DISPOSABLE.has(e.split("@")[1])) errors.email = "Temporary / disposable emails are not allowed";

  if (!p) errors.password = "Password is required";
  else if (p.length < 8) errors.password = "Password must be at least 8 characters";
  else if (p.length > 72) errors.password = "Password must be at most 72 characters";
  else if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) errors.password = "Password needs at least one letter and one number";

  return { errors, values: { name: n, email: e, password: p } };
}

function validateSubjectName(raw) {
  const v = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (v.length < 2 || v.length > 40 || !/^[A-Za-z0-9 +#.\-/&]+$/.test(v)) return null;
  return v;
}

const slugify = (s) =>
  s.toLowerCase().replace(/\+/g, "plus").replace(/#/g, "sharp").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

module.exports = { validateSignup, validateSubjectName, slugify };
