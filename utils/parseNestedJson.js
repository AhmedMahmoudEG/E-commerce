// Parse JSON fields helper
exports.parseJsonFields = (body, fields) => {
  const parsed = { ...body };
  for (const field of fields) {
    if (body[field] && typeof body[field] === "string") {
      try {
        parsed[field] = JSON.parse(body[field]);
      } catch (error) {
        throw new Error(`Invalid JSON format for ${field} field`);
      }
    }
  }
  return parsed;
};
