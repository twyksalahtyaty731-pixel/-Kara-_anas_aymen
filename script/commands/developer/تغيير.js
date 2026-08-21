module.exports.config = {
  name: "تغيير",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "تويكس",
  description: "تغيير ألقاب جميع الأعضاء في المجموعة إلى اسم محدد",
  commandCategory: "developer",
  usages: "تغيير [الاسم الجديد]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const adminList = global.config.ADMINBOT || [];

  if (!adminList.includes(senderID)) {
    return api.sendMessage("⛔ هذا الأمر مخصص للمطور فقط.", threadID, messageID);
  }

  const newNickname = args.join(" ");
  if (!newNickname) {
    return api.sendMessage("📝 يرجى كتابة الاسم الجديد.\nالاستخدام: تغيير [الاسم]", threadID, messageID);
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
    if (!isBotAdmin) {
      return api.sendMessage("❌ البوت ليس مشرفاً في هذه المجموعة، لا يمكنه تغيير الألقاب.", threadID, messageID);
    }

    const members = threadInfo.participantIDs || [];
    const targetMembers = members.filter(id => id !== senderID && id !== botID && !adminList.includes(id));

    if (targetMembers.length === 0) {
      return api.sendMessage("✅ لا يوجد أعضاء آخرين لتغيير ألقابهم.", threadID, messageID);
    }

    let successCount = 0;
    let failCount = 0;

    for (const uid of targetMembers) {
      try {
        await api.changeNickname(newNickname, threadID, uid);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        failCount++;
        console.error(`فشل تغيير لقب ${uid}:`, err.message);
      }
    }

    return api.sendMessage(
      `⌬ ━━ MIRA 𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘 ━━ ⌬\n\n✅ تم تغيير ألقاب ${successCount} شخص إلى: "${newNickname}"\n❌ فشل تغيير ${failCount} شخص.`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("خطأ في تغيير:", error);
    return api.sendMessage(`❌ حدث خطأ أثناء تنفيذ الأمر: ${error.message}`, threadID, messageID);
  }
};
