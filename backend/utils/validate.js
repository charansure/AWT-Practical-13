const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

// partial = true -> every field optional (used by PUT)
function validateTask(body, partial = false) {
  const errors = [];
  const clean = {};

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"], clean };
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length < 2) {
      errors.push("title must be a string with at least 2 characters");
    } else clean.title = body.title.trim();
  } else if (!partial) errors.push("title is required");

  if (body.description !== undefined) {
    if (typeof body.description !== "string") errors.push("description must be a string");
    else clean.description = body.description.trim();
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) errors.push(`status must be one of: ${STATUSES.join(", ")}`);
    else clean.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) errors.push(`priority must be one of: ${PRIORITIES.join(", ")}`);
    else clean.priority = body.priority;
  }

  if (partial && errors.length === 0 && Object.keys(clean).length === 0) {
    errors.push("At least one field is required to update");
  }

  return { ok: errors.length === 0, errors, clean };
}

module.exports = { validateTask, STATUSES, PRIORITIES };
