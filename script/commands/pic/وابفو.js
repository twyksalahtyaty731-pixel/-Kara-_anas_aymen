const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "وايفو",
  version: "3.6",
  hasPermssion: 0,
  credits: "أنس",
  description: "إرسال صور أنمي متنوعة",
  commandCategory: "pic",
  usages: "<النوع>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const typesMap = {
    "وايفو": "waifu",
    "نيكو": "neko",
    "شينوبو": "shinobu",
    "ميغومين": "megumin",
    "مزاح": "bully",
    "حضن": "cuddle",
    "بكاء": "cry",
    "عناق": "hug",
    "ربت": "pat",
    "خجل": "blush",
    "ابتسامة": "smile",
    "رقصة": "dance",
    "غمزة": "wink",
    "نغز": "poke",
    "أكل": "nom"
  };

  const name = args.join(" ").trim();

  // =========================
  // عرض القائمة
  // =========================

  if (!name) {
    const keys = Object.keys(typesMap);

    let list = "⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬\n\n";

    list += "✨ الأنواع المتاحة:\n\n";
    list += keys.join(" ، ");

    list +=
      "\n\n💡 مثال:\n" +
      "『 وايفو حضن 』\n\n" +
      "⌬ ━━━━━━━━━━━━━━ ⌬";

    return api.sendMessage(
      list,
      threadID,
      messageID
    );
  }

  // =========================
  // التحقق من النوع
  // =========================

  const engName = typesMap[name];

  if (!engName) {
    return api.sendMessage(
      "⚠️ | هذا النوع غير متوفر.\n\n" +
      "اكتب «وايفو» لعرض القائمة.",
      threadID,
      messageID
    );
  }

  // تفاعل انتظار
  try {
    api.setMessageReaction(
      "⏳",
      messageID,
      () => {},
      true
    );
  } catch (e) {}

  const cacheDir = path.join(
    __dirname,
    "cache"
  );

  const cachePath = path.join(
    cacheDir,
    `waifu_${Date.now()}.jpg`
  );

  try {
    // =========================
    // إنشاء مجلد الكاش
    // =========================

    await fs.ensureDir(cacheDir);

    // =========================
    // طلب الصورة
    // =========================

    const res = await axios.get(
      `https://api.waifu.pics/sfw/${engName}`,
      {
        timeout: 15000
      }
    );

    if (!res.data || !res.data.url) {
      throw new Error("لم يتم العثور على رابط الصورة");
    }

    const imgUrl = res.data.url;

    // =========================
    // تحميل الصورة
    // =========================

    const imgRes = await axios.get(
      imgUrl,
      {
        responseType: "arraybuffer",
        timeout: 15000
      }
    );

    await fs.writeFile(
      cachePath,
      Buffer.from(imgRes.data)
    );

    // =========================
    // نجاح
    // =========================

    try {
      api.setMessageReaction(
        "✅",
        messageID,
        () => {},
        true
      );
    } catch (e) {}

    // =========================
    // إرسال الصورة
    // =========================

    return api.sendMessage(
      {
        body:
          `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬\n\n` +
          `🖼️ النوع: ${name}\n` +
          `✨ المصدر: Waifu.pics\n\n` +
          `👍 تفاعل بـ 👍 للحصول على صورة جديدة\n\n` +
          `⌬ ━━━━━━━━━━━━━━ ⌬`,

        attachment:
          fs.createReadStream(cachePath)
      },

      threadID,

      async (err, info) => {

        // حذف الكاش
        try {
          if (await fs.pathExists(cachePath)) {
            await fs.unlink(cachePath);
          }
        } catch (e) {}

        // تسجيل التفاعل
        if (
          !err &&
          info &&
          global.client &&
          global.client.handleReaction
        ) {
          global.client.handleReaction.push({
            name: "وايفو",
            messageID: info.messageID,
            author: senderID,
            engName: engName,
            typeName: name
          });
        }
      }
    );

  } catch (error) {

    console.error(
      "❌ Waifu Error:",
      error.message
    );

    // حذف الملف إذا موجود
    try {
      if (await fs.pathExists(cachePath)) {
        await fs.unlink(cachePath);
      }
    } catch (e) {}

    try {
      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );
    } catch (e) {}

    return api.sendMessage(
      "✖ | حدث خطأ أثناء جلب صورة الأنمي.\n" +
      "🔄 حاول مرة أخرى بعد قليل.",
      threadID
    );
  }
};


// ==================================================
//                 نظام التفاعل
// ==================================================

module.exports.handleReaction = async function ({
  api,
  event,
  handleReaction
}) {

  if (!handleReaction) return;

  // الشخص الذي ضغط يجب أن يكون صاحب الطلب
  if (
    String(event.userID) !==
    String(handleReaction.author)
  ) {
    return;
  }

  // فقط 👍
  if (event.reaction !== "👍") {
    return;
  }

  const engName = handleReaction.engName;
  const typeName = handleReaction.typeName;

  if (!engName) return;

  const cacheDir = path.join(
    __dirname,
    "cache"
  );

  const cachePath = path.join(
    cacheDir,
    `waifu_reaction_${Date.now()}.jpg`
  );

  try {

    await fs.ensureDir(cacheDir);

    // =========================
    // جلب صورة جديدة
    // =========================

    const res = await axios.get(
      `https://api.waifu.pics/sfw/${engName}`,
      {
        timeout: 15000
      }
    );

    if (!res.data || !res.data.url) {
      throw new Error("No image URL");
    }

    // =========================
    // تحميل الصورة
    // =========================

    const imgRes = await axios.get(
      res.data.url,
      {
        responseType: "arraybuffer",
        timeout: 15000
      }
    );

    await fs.writeFile(
      cachePath,
      Buffer.from(imgRes.data)
    );

    // =========================
    // إرسال الصورة الجديدة
    // =========================

    return api.sendMessage(
      {
        body:
          `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬\n\n` +
          `🔄 صورة جديدة\n` +
          `🖼️ النوع: ${typeName}`,

        attachment:
          fs.createReadStream(cachePath)
      },

      event.threadID,

      async () => {

        try {
          if (await fs.pathExists(cachePath)) {
            await fs.unlink(cachePath);
          }
        } catch (e) {}

      }
    );

  } catch (error) {

    console.error(
      "❌ Reaction Error:",
      error.message
    );

    try {
      if (await fs.pathExists(cachePath)) {
        await fs.unlink(cachePath);
      }
    } catch (e) {}

    return api.sendMessage(
      "✖ | تعذر جلب صورة جديدة، حاول مرة أخرى.",
      event.threadID
    );
  }
};
