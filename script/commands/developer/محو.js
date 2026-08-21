
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "محو",
  version: "1.0.2",
  hasPermssion: 2,
  credits: "تويكس",
  description: "طرد جميع الأعضاء من المجموعة عدا المطور مع GIF شرير أنمي",
  commandCategory: "developer",
  usages: "محو",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const adminList = global.config.ADMINBOT || [];

  // التحقق من المطور
  if (!adminList.includes(senderID)) {
    return api.sendMessage("⛔ هذا الأمر مخصص للمطور فقط.", threadID, messageID);
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
    if (!isBotAdmin) {
      return api.sendMessage("❌ البوت ليس مشرفاً في هذه المجموعة، لا يمكنه طرد الأعضاء.", threadID, messageID);
    }

    const members = threadInfo.participantIDs || [];
    const targetMembers = members.filter(id => id !== senderID && id !== botID);

    if (targetMembers.length === 0) {
      return api.sendMessage("✅ لا يوجد أعضاء آخرين لطردهم.", threadID, messageID);
    }

    // تحميل GIF شرير أنمي
    let attachment = null;
    const cacheDir = path.join(__dirname, "cache");
    const gifPath = path.join(cacheDir, `erase_${Date.now()}.gif`);

    try {
      fs.ensureDirSync(cacheDir);
      // رابط GIF شرير أنمي (يمكن تغييره)
      const gifUrl = "https://media.giphy.com/media/l3q2z9Rbs8d6LlnaE/giphy.gif";
      const response = await axios.get(gifUrl, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(gifPath, Buffer.from(response.data));
      attachment = fs.createReadStream(gifPath);
    } catch (e) {
      console.warn("⚠️ فشل تحميل GIF الشرير، سيتم الإرسال بدون مرفق.", e.message);
    }

    // رسالة التهديد مع GIF
    const warningMsg = "⌬ ━━ MIRA 𝗗𝗘𝗦𝗧𝗥𝗢𝗬𝗘𝗥 ━━ ⌬\n\n🔥 سيتم طرد جميع الحشرات من هذه المجموعة!\n💀 عدا المطور الأعلى.\n\n⚡ بدء الإبادة الآن...";
    await api.sendMessage({
      body: warningMsg,
      attachment: attachment || null
    }, threadID);

    // حذف الملف المؤقت بعد الإرسال
    if (attachment && fs.existsSync(gifPath)) {
      fs.unlinkSync(gifPath);
    }

    // طرد الأعضاء مع تأخير
    let successCount = 0;
    let failCount = 0;

    for (const uid of targetMembers) {
      try {
        await api.removeUserFromGroup(uid, threadID);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        failCount++;
        console.error(`فشل طرد ${uid}:`, err.message);
      }
    }

    return api.sendMessage(
      `⌬ ━━ MIRA 𝗘𝗥𝗔𝗦𝗘 ━━ ⌬\n\n✅ تم طرد ${successCount} شخص.\n❌ فشل طرد ${failCount} شخص.\n💀 تم القضاء على الحشرات.`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("خطأ في محو:", error);
    return api.sendMessage(`❌ حدث خطأ أثناء تنفيذ الأمر: ${error.message}`, threadID, messageID);
  }
};
