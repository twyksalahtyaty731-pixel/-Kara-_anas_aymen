
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Canvas = require("canvas");

module.exports.config = {
  name: "botAdded",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "تويكس",
  description: "ترحيب عند إضافة البوت لمجموعة جديدة"
};

module.exports.run = async function ({ api, event, Threads }) {
  const { threadID, logMessageData } = event;
  const botID = api.getCurrentUserID();

  // التحقق مما إذا كان البوت هو المضاف
  const addedParticipants = logMessageData.addedParticipants || [];
  const isBotAdded = addedParticipants.some(user => user.userFbId === botID);

  if (!isBotAdded) return;

  // جلب معلومات المجموعة
  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName || "مجموعة جديدة";
  const memberCount = threadInfo.participantIDs.length;

  // إنشاء صورة ترحيبية باستخدام Canvas
  const canvas = Canvas.createCanvas(800, 400);
  const ctx = canvas.getContext("2d");

  // خلفية متدرجة
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1a0a00");
  gradient.addColorStop(0.5, "#4a0010");
  gradient.addColorStop(1, "#8B0000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // إطار زخرفي
  ctx.strokeStyle = "#FF6600";
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // نص الترحيب
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // عنوان "ميرا"
  ctx.font = "bold 80px 'Arial'";
  ctx.fillStyle = "#FFD700";
  ctx.shadowColor = "#FF2200";
  ctx.shadowBlur = 20;
  ctx.fillText("ميرا", canvas.width / 2, 120);

  // جملة "نورتكم"
  ctx.font = "bold 50px 'Arial'";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowBlur = 10;
  ctx.fillText("نورتكم 💫", canvas.width / 2, 220);

  // عدد الأعضاء
  ctx.font = "30px 'Arial'";
  ctx.fillStyle = "#E8D5B0";
  ctx.shadowBlur = 5;
  ctx.fillText(`👥 عدد الأعضاء: ${memberCount}`, canvas.width / 2, 310);

  // حفظ الصورة مؤقتاً
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imagePath = path.join(cacheDir, `welcome_${threadID}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(imagePath, buffer);

  // إرسال الرسالة مع الصورة
  const message = `🎉 تم إضافة البوت إلى المجموعة\n📍 ${groupName}\n👥 عدد الأعضاء: ${memberCount}\n\n✨ ميرا في خدمتكم 🤍`;

  await api.sendMessage({
    body: message,
    attachment: fs.createReadStream(imagePath)
  }, threadID);

  // حذف الملف المؤقت
  fs.unlinkSync(imagePath);
};
