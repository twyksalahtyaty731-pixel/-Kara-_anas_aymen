
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "طرد",
  version: "1.3.0",
  hasPermssion: 1,
  credits: "تويكس",
  description: "طرد عضو مع حماية مطوري البوت من الكونسق",
  commandCategory: "admin",
  usages: "[@منشن] أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;

  const config = global.config.ADMINBOT || [];

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    if (!isAdmin) {
      return api.sendMessage(
        "⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون مشرفاً في المجموعة لاستخدام هذا الأمر",
        threadID,
        messageID
      );
    }

    let targetID;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage(
        "⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• طرد @منشن\n• أو قم بالرد على رسالة العضو المراد طرده",
        threadID,
        messageID
      );
    }

    if (config.includes(targetID)) {
      return api.sendMessage(
        "⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🚫 حماية المطور مفعلة! لا يمكنني طرد أحد مطوري أو مدراء البوت العظماء.",
        threadID,
        messageID
      );
    }

    if (targetID === botID) {
      return api.sendMessage(
        "⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!",
        threadID,
        messageID
      );
    }

    await api.removeUserFromGroup(targetID, threadID);

    // مسار الفيديو المرفق مع هذا الأمر (نفس مجلد admin مباشرة)
    const videoPath = path.join(__dirname, "kick_bye-2.mp4");

    if (fs.existsSync(videoPath)) {
      return api.sendMessage(
        {
          body: `⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم طرد العضو بنجاح من المجموعة\nإلى اللقاء 🧙‍♂️`,
          attachment: fs.createReadStream(videoPath)
        },
        threadID
      );
    } else {
      return api.sendMessage(
        `⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم طرد العضو بنجاح من المجموعة\nإلى اللقاء 🧙‍♂️`,
        threadID
      );
    }

  } catch (error) {
    console.error("طرد - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ 𝗠𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء طرد العضو\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};
