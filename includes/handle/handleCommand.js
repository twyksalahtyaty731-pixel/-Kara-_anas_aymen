
if (
          banUsers.includes(command.config.name)
        ) {
          return api.sendMessage(
            ⌬ ━━ MIRA 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬\n\n⛔ أنت محظور من استخدام هذا الأمر,
            threadID,
            messageID
          );
        }
      }
    }

    // =========================
    // حماية NSFW
    // =========================

    if (
      command.config.commandCategory &&
      command.config.commandCategory.toLowerCase() === "nsfw" &&
      !global.data.threadAllowNSFW.includes(threadID) &&
      !isAdmin
    ) {
      return api.sendMessage(
        ⌬ ━━ MIRA 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n🔞 محتوى محظور في هذه المجموعة,
        threadID,
        messageID
      );
    }

    // =========================
    // حساب الصلاحيات
    // =========================

    let permssion = 0;

    let threadInfoo2;

    try {
      threadInfoo2 =
        threadInfo.get(threadID) ||
        (await Threads.getInfo(threadID));
    } catch (e) {
      threadInfoo2 = null;
    }

    const adminIDs =
      threadInfoo2 &&
      Array.isArray(threadInfoo2.adminIDs)
        ? threadInfoo2.adminIDs
        : [];

    const find = adminIDs.find(
      el => String(el.id) === senderID
    );

    // المطور = صلاحية 2
    if (isAdmin) {
      permssion = 2;
    }

    // أدمن المجموعة = صلاحية 1
    else if (find) {
      permssion = 1;
    }

    // =========================
    // فحص صلاحية الأمر
    // =========================

    const requiredPermission =
      Number(command.config.hasPermssion) || 0;

    if (requiredPermission > permssion) {
      return api.sendMessage(
        ⌬ ━━ MIRA 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬\n\n⚠️ ليس لديك صلاحية لتنفيذ هذا الأمر,
        threadID,
        messageID
      );
    }

    // =========================
    // نظام Cooldown
    // =========================

    if (!cooldowns.has(command.config.name)) {
      cooldowns.set(
        command.config.name,
        new Map()
      );
    }

    const timestamps =
      cooldowns.get(command.config.name);

    const expirationTime =
      (Number(command.config.cooldowns) || 1) * 1000;

    if (
      timestamps.has(senderID) &&
      dateNow <
        timestamps.get(senderID) + expirationTime
    ) {
      return api.setMessageReaction(
        "⏳",
        messageID,
        () => {},
        true
      );
    }

    // =========================
    // تشغيل الأمر
    // =========================

    try {
      const Obj = {
        api,
        event,
        args,
        models,
        Users,
        Threads,
        Currencies,
        permssion,
        getText: () => {}
      };

      await command.run(Obj);

      timestamps.set(senderID, dateNow);

      return;

    } catch (e) {
      console.error(
        [COMMAND ERROR] ${command.config.name},
        e
      );

      return api.sendMessage(
        ⌬ ━━ MIRA 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 ━━ ⌬\n\n❌ حدث خطأ أثناء تنفيذ الأمر\n\n${e.message},
        threadID
      );
    }
  };
};
