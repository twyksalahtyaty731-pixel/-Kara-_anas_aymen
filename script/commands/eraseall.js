const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "eraseall",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "تويكس",
  description: "طرد جميع الأعضاء من المجموعة عدا المطور (تحذير: لا تستخدم إلا في الحالات القصوى)",
  commandCategory: "developer",
  usages: "eraseall",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const adminList = global.config.ADMINBOT || [];

  // التحقق من صلاحية المطور
  if (!adminList.includes(senderID)) {
    return api.sendMessage("⛔ هذا الأمر مخصص للمطور فقط.", threadID, messageID);
  }

  // جلب معلومات المجموعة
  const threadInfo = await api.getThreadInfo(threadID);
  const botID = api.getCurrentUserID();

  // التأكد من أن البوت مشرف (ضروري للطرد)
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
  if (!isBotAdmin) {
    return api.sendMessage("❌ البوت ليس مشرفاً في هذه المجموعة، لا يمكنه طرد الأعضاء.", threadID, messageID);
  }

  // قائمة الأعضاء المستهدفين (كل الأعضاء عدا المطور)
  const members = threadInfo.participantIDs;
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
    const gifUrl = "https://media.giphy.com/media/l3q2z9Rbs8d6LlnaE/giphy.gif"; // أنمي شرير (يمكن تغييره)
    const response = await axios.get(gifUrl, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(gifPath, Buffer.from(response.data));
    attachment = fs.createReadStream(gifPath);
  } catch (e) {
    console.warn("⚠️ فشل تحميل GIF الشرير:", e.message);
    // نستمر بدون GIF
  }

  // إرسال رسالة التهديد مع GIF
  const warningMsg = "⌬ ━━ MIRA 𝗗𝗘𝗦𝗧𝗥𝗢𝗬𝗘𝗥 ━━ ⌬\n\n🔥 سيتم طرد جميع الحشرات من هذه المجموعة!\n💀 عدا المطور الأعلى.\n\n⚡ بدء الإبادة الآن...";
  await api.sendMessage({
    body: warningMsg,
    attachment: attachment || null
  }, threadID);

  // حذف الملف المؤقت بعد الإرسال
  if (attachment && fs.existsSync(gifPath)) {
    fs.unlinkSync(gifPath);
  }

  // طرد الأعضاء واحداً تلو الآخر مع تأخير بسيط لتجنب الحظر
  let successCount = 0;
  let failCount = 0;

  for (const uid of targetMembers) {
    try {
      await api.removeUserFromGroup(uid, threadID);
      successCount++;
      // تأخير 200ms بين كل طرد لتجنب الـ Rate Limit
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      failCount++;
      console.error(`فشل طرد ${uid}:`, err.message);
    }
  }

  // إرسال تقرير نهائي
  return api.sendMessage(
    `⌬ ━━ MIRA 𝗘𝗥𝗔𝗦𝗘 ━━ ⌬\n\n✅ تم طرد ${successCount} شخص.\n❌ فشل طرد ${failCount} شخص.\n💀 تم القضاء على الحشرات.`,
    threadID,
    messageID
  );
};
