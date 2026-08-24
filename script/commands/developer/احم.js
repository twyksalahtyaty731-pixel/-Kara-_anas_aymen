
module.exports.config = {
  name: "احم",
  version: "1.0.2",
  hasPermssion: 2,
  credits: "تويكس",
  description: "رفع المطور مسؤولاً من الكونسل",
  commandCategory: "developer",
  usages: "احم",
  cooldowns: 2
};

module.exports.run = async ({ api, event }) => {
  const { threadID, senderID } = event;

  const adminID = String(global.config.ADMINBOT[0]);
  const userID = String(senderID);

  // التحقق من المطور
  if (userID !== adminID) {
    return api.sendMessage(
      "⌬ ━━━━━━━━━━━━ ⌬\n⚠️ هـذا الأمـر لـلـمـطـور فـقـط\n⌬ ━━━━━━━━━━━━ ⌬",
      threadID
    );
  }

  return api.changeAdminStatus(threadID, adminID, true, (err) => {
    if (err) {
      return api.sendMessage(
        "⌬ ━━━━━━━━━━━━ ⌬\n❌ يـرجـى رفـع الـبـوت أولاً\n⌬ ━━━━━━━━━━━━ ⌬",
        threadID
      );
    }

    return api.sendMessage(
      "⌬ ━━━━━━━━━━━━ ⌬\n✅ تـم الـتـنـفـيـذ سـيـدي\n⌬ ━━━━━━━━━━━━ ⌬",
      threadID,
      (err, info) => {
        if (!err && info?.messageID) {
          setTimeout(() => api.unsendMessage(info.messageID), 300);
        }
      }
    );
  });
};
