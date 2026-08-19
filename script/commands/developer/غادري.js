
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "غادري",
  version: "1.2.7",
  hasPermssion: 2,
  credits: "تويكس",
  description: "مغادرة البوت للمجموعة (للمطور فقط)",
  commandCategory: "developer",
  usages: "غادري [ID]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, senderID } = event;
  const adminList = global.config.ADMINBOT || [];

  // التحقق من صلاحية المطور
  if (!adminList.includes(senderID)) {
    return api.sendMessage("⛔ هذا الأمر مخصص للمطور فقط.", threadID);
  }

  const targetID = args[0] ? String(args[0]).trim() : threadID;
  const cacheDir = path.join(__dirname, "cache");
  const pathGif = path.join(cacheDir, "bye.gif");

  const leaveGroup = (target) => {
    try {
      api.removeUserFromGroup(api.getCurrentUserID(), target);
    } catch (err) {
      console.error("خطأ أثناء المغادرة:", err);
    }
  };

  const cleanUp = () => {
    try {
      if (fs.existsSync(pathGif)) fs.unlinkSync(pathGif);
    } catch (_) {}
  };

  // محاولة إرسال رسالة وداع مع GIF
  try {
    fs.ensureDirSync(cacheDir);

    let attachment = null;
    try {
      const response = await axios.get(
        "https://media.giphy.com/media/kaBU6pgv0OsPHz2yxy/giphy.gif",
        { responseType: "arraybuffer", timeout: 10000 }
      );
      fs.writeFileSync(pathGif, Buffer.from(response.data));
      attachment = fs.createReadStream(pathGif);
    } catch (gifError) {
      console.warn("فشل تحميل GIF، سيتم الإرسال بدون مرفق.", gifError.message);
    }

    const msgBody = "⌬ ━━ MIRA ━━ ⌬\n\nحبيبي تويكس،\nنغادر الآن بكل هيبة.. وداعاً. 👑";

    await new Promise((resolve, reject) => {
      api.sendMessage(
        {
          body: msgBody,
          attachment: attachment || null
        },
        targetID,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // تأخير ثم المغادرة
    setTimeout(() => {
      leaveGroup(targetID);
      cleanUp();
    }, 1500);

    // رد فعل تأكيد للمطور
    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (e) {
    console.error("خطأ في أمر غادري:", e);
    cleanUp();
    // في حالة فشل الإرسال، نغادر بدون رسالة
    leaveGroup(targetID);
    api.sendMessage("❌ حدث خطأ أثناء محاولة المغادرة، لكن تم تنفيذ الخروج.", threadID);
  }
};
