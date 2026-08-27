/*
 * 📺 يوتيوب — YouTube Search
 * بحث وعرض نتائج يوتيوب
 */

const axios = require("axios");

// ══════════════════════════════════════
// زخرفة
// ══════════════════════════════════════
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n`;
  m += ` ⦿ ⟬ ${title} ⟭ ⦿\n`;
  m += `┝━━━━━━━━━━━━━━━\n`;

  for (const l of lines) {
    m += `┇ ${l}\n`;
  }

  if (footer) {
    m += `┝━━━━━━━━━━━━━━━\n`;
    for (const f of footer) {
      m += `┇ ${f}\n`;
    }
  }

  return m + `●─────── ✾ ───────●`;
};

// ══════════════════════════════════════
// حفظ الرد
// ══════════════════════════════════════
function saveReply(info, data, senderID) {
  if (!info?.messageID) return;

  if (!global.client) global.client = {};
  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push({
    name: "يوتيوب",
    messageID: info.messageID,
    author: senderID,
    ...data
  });
}

// ══════════════════════════════════════
// البحث في YouTube
// ══════════════════════════════════════
async function searchYouTube(query, max = 6) {
  const { data: html } = await axios.get(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.9"
      },
      timeout: 15000
    }
  );

  const match =
    html.match(/var ytInitialData = ({.+?});<\/script>/s) ||
    html.match(/var ytInitialData = ({.+?});/s);

  if (!match) {
    throw new Error("تعذر الحصول على نتائج YouTube");
  }

  const ytData = JSON.parse(match[1]);

  const sections =
    ytData?.contents
      ?.twoColumnSearchResultsRenderer
      ?.primaryContents
      ?.sectionListRenderer
      ?.contents || [];

  const videos = [];

  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents || [];

    for (const item of items) {
      if (videos.length >= max) break;

      const video = item?.videoRenderer;

      if (!video?.videoId) continue;

      const title =
        video?.title?.runs?.[0]?.text ||
        video?.title?.simpleText ||
        "بدون عنوان";

      const channel =
        video?.ownerText?.runs?.[0]?.text ||
        video?.shortBylineText?.runs?.[0]?.text ||
        "غير معروف";

      const duration =
        video?.lengthText?.simpleText ||
        "غير معروف";

      videos.push({
        videoId: video.videoId,
        title:
          title.length > 70
            ? title.slice(0, 70) + "..."
            : title,
        channel:
          channel.length > 40
            ? channel.slice(0, 40) + "..."
            : channel,
        duration,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        thumbnail:
          `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
      });
    }

    if (videos.length >= max) break;
  }

  return videos;
}

// ══════════════════════════════════════
// إعداد الأمر
// ══════════════════════════════════════
module.exports.config = {
  name: "يوتيوب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Yamada KJ & Chitron",
  description: "البحث عن فيديوهات YouTube",
  commandCategory: "media",
  usages: "يوتيوب اسم الفيديو",
  cooldowns: 5
};

// ══════════════════════════════════════
// تنفيذ الأمر
// ══════════════════════════════════════
module.exports.run = async function ({
  api,
  event,
  args
}) {
  const { threadID, messageID, senderID } = event;

  const query = args.join(" ").trim();

  if (!query) {
    return api.sendMessage(
      BOX("📺 يوتيوب", [
        "اكتب اسم الفيديو الذي تريد البحث عنه.",
        "",
        "مثال:",
        "يوتيوب اغاني عربية"
      ]),
      threadID,
      messageID
    );
  }

  try {
    await api.sendMessage(
      BOX("🔎 البحث", [
        `جاري البحث عن: ${query}`,
        "يرجى الانتظار..."
      ]),
      threadID
    );

    const videos = await searchYouTube(query, 6);

    if (!videos.length) {
      return api.sendMessage(
        BOX("❌ النتيجة", [
          "لم يتم العثور على أي فيديو.",
          "حاول استخدام كلمات بحث مختلفة."
        ]),
        threadID
      );
    }

    const lines = [];

    videos.forEach((video, index) => {
      lines.push(
        `${index + 1}️⃣ ${video.title}`,
        `   👤 ${video.channel}`,
        `   ⏱️ ${video.duration}`,
        ""
      );
    });

    lines.push("↩️ أرسل رقم الفيديو لاختياره.");

    const info = await api.sendMessage(
      BOX("📺 نتائج YouTube", lines),
      threadID
    );

    saveReply(info, {
      type: "youtube_results",
      videos
    }, senderID);

  } catch (error) {
    console.error("YouTube Error:", error);

    return api.sendMessage(
      BOX("❌ خطأ", [
        "حدث خطأ أثناء البحث.",
        "حاول مرة أخرى بعد قليل."
      ]),
      threadID
    );
  }
};

// ══════════════════════════════════════
// التعامل مع اختيار النتيجة
// ══════════════════════════════════════
module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  const { threadID, senderID, body } = event;

  if (handleReply.author !== senderID) {
    return;
  }

  if (handleReply.type !== "youtube_results") {
    return;
  }

  const number = parseInt(body.trim());

  if (
    isNaN(number) ||
    number < 1 ||
    number > handleReply.videos.length
  ) {
    return api.sendMessage(
      "❌ أرسل رقمًا صحيحًا من النتائج.",
      threadID
    );
  }

  const video = handleReply.videos[number - 1];

  return api.sendMessage(
    BOX("🎬 تم اختيار الفيديو", [
      `📌 ${video.title}`,
      `👤 ${video.channel}`,
      `⏱️ ${video.duration}`,
      "",
      `🔗 ${video.url}`
    ]),
    threadID
  );
};
