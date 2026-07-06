const { ulid } = require("ulid");

function generateId() {
  return ulid();
}

module.exports = generateId;