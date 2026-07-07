var DataTypes = require("sequelize").DataTypes;
var _articles = require("./articles");
var _chat_rooms = require("./chat_rooms");
var _diagnosis_history = require("./diagnosis_history");
var _hospitals = require("./hospitals");
var _messages = require("./messages");
var _user_symptoms = require("./user_symptoms");
var _user_tokens = require("./user_tokens");
var _users = require("./users");

function initModels(sequelize) {
  var articles = _articles(sequelize, DataTypes);
  var chat_rooms = _chat_rooms(sequelize, DataTypes);
  var diagnosis_history = _diagnosis_history(sequelize, DataTypes);
  var hospitals = _hospitals(sequelize, DataTypes);
  var messages = _messages(sequelize, DataTypes);
  var user_symptoms = _user_symptoms(sequelize, DataTypes);
  var user_tokens = _user_tokens(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  messages.belongsTo(chat_rooms, { as: "room", foreignKey: "room_id"});
  chat_rooms.hasMany(messages, { as: "messages", foreignKey: "room_id"});
  diagnosis_history.belongsTo(user_symptoms, { as: "symptom_log", foreignKey: "symptom_log_id"});
  user_symptoms.hasMany(diagnosis_history, { as: "diagnosis_histories", foreignKey: "symptom_log_id"});
  chat_rooms.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(chat_rooms, { as: "chat_rooms", foreignKey: "user_id"});
  chat_rooms.belongsTo(users, { as: "admin", foreignKey: "admin_id"});
  users.hasMany(chat_rooms, { as: "admin_chat_rooms", foreignKey: "admin_id"});
  diagnosis_history.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(diagnosis_history, { as: "diagnosis_histories", foreignKey: "user_id"});
  messages.belongsTo(users, { as: "sender", foreignKey: "sender_id"});
  users.hasMany(messages, { as: "messages", foreignKey: "sender_id"});
  user_symptoms.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_symptoms, { as: "user_symptoms", foreignKey: "user_id"});
  user_tokens.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_tokens, { as: "user_tokens", foreignKey: "user_id"});

  return {
    articles,
    chat_rooms,
    diagnosis_history,
    hospitals,
    messages,
    user_symptoms,
    user_tokens,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
