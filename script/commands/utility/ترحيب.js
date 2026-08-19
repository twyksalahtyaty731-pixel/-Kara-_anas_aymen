const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "welcome",
  version: "1.0.0",
  credits: "تويكس",
  description: "ترحيب تلقائي بالأعضاء الجدد مع GIF أنمي",
  eventType: ["log:subscribe"],
  hasPermssion: 0
};

module.exports.run = async function({ api, event, Threads }) {
  const { logMessageData, threadID, senderID } = event;
  const botID = api.getCurrentUserID();
  const addedUsers = logMessageData.addedParticipants || [];

  // تجاهل إذا لم يكن هناك أعضاء جدد
  if (addedUsers.length === 0) return;

  // تجاهل إذا كان البوت هو المضاف (لتجنب الترحيب بنفسه)
  const isBotAdded = addedUsers.some(user => user.userFbId === botID);
  if (isBotAdded) return;

  // جلب معلومات المجموعة
  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName || "المجموعة";

  // جلب إعدادات المجموعة (اختياري لتفعيل/تعطيل الترحيب)
  const threadData = (await Threads.getData(threadID)) || {};
  const welcomeEnabled = threadData.data?.welcome !== false; // مفعل افتراضياً

  if (!welcomeEnabled) return;

  // تحضير الرسالة لكل عضو مضاف
  for (const user of addedUsers) {
    const userName = user.fullName || "عضو جديد";

    // رسالة الترحيب مع منشن
    const welcomeMessage = `🎉 نورتنا يا ${userName} 🎉\n📍 في ${groupName}\n\n📜 الرجاء الالتزام بالقواعد:\n• لا سب أو شتائم\n• لا روابط مشبوهة\n• احترام الجميع\n\nاستمتع معنا 🤍`;

    // تحميل GIF ترحيب أنمي
    let attachment = null;
    const cacheDir = path.join(__dirname, "cache");
    const gifPath = path.join(cacheDir, `welcome_${Date.now()}.gif`);

    try {
      fs.ensureDirSync(cacheDir);

      // رابط GIF أنمي ترحيبي (يمكن تغييره)
      const gifUrl = "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif";
      const response = await axios.get(gifUrl, {
        responseType: "arraybuffer",
        timeout: 10000
      });

      fs.writeFileSync(gifPath, Buffer.from(response.data));
      attachment = fs.createReadStream(gifPath);
    } catch (e) {
      console.warn("⚠️ فشل تحميل GIF الترحيب:", e.message);
      // استمر بدون GIF
    }

    // إرسال رسالة الترحيب مع المرفق
    try {
      await api.sendMessage({
        body: welcomeMessage,
        mentions: [{
          tag: userName,
          id: user.userFbId
        }],
        attachment: attachment || null
      }, threadID);

      // حذف الملف المؤقت بعد الإرسال
      if (attachment && fs.existsSync(gifPath)) {
        fs.unlinkSync(gifPath);
      }
    } catch (err) {
      console.error("❌ فشل إرسال الترحيب:", err);
      // محاولة إرسال بدون مرفق أو منشن في حال الفشل
      try {
        await api.sendMessage(welcomeMessage, threadID);
      } catch (_) {}
    }
  }
};
