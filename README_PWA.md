إرشادات تفعيل PWA و Supabase

- افتح `scripts/supabase-init.js` وضع قيم `SUPABASE_URL` و`SUPABASE_ANON_KEY` من مشروع Supabase.
- أضف أيقونات بصيغة PNG في المسار `/icons/icon-192.png` و`/icons/icon-512.png` لتحسين تثبيت التطبيق.
- لتجربة محلية: شغّل خادم محلي (مثلاً `npx http-server . -p 8080`) ثم افتح `http://localhost:8080/lumina_pro/code.html`.
- بعد التحميل، سيحاول المتصفح تسجيل `sw.js` وتفعيل PWA. افتح أدوات المطور لأن ترى الأخطاء إن وجدت.

تشغيل سكربت الحقن لتحديث كل صفحات `code.html` تلقائياً:

```bash
node scripts/inject_pwa.js
```

ثم افتح خادم محلي لتجربة PWA:

```bash
npx http-server . -p 8080
```
