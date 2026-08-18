#!/bin/bash

# MIRA Bot Auto Restart Script
# المطور: TWIX

echo "🚀 Starting MIRA Bot..."
echo "المطور: TWIX | البوت: mira"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while true; do
    node index.js
    echo ""
    echo "⚠️ Bot stopped. Restarting in 5 seconds..."
    echo "البوت توقف. إعادة تشغيل بعد 5 ثوان..."
    sleep 5
done
