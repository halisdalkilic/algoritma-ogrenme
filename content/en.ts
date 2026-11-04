import { createContent } from "./load";

// İngilizce ders içeriği. BU DOSYA ÜRETİLİR: `node scripts/gen-en-index.mjs` (content/en/worlds altındaki dosyaları listeler).
// Her ders Türkçesiyle aynı dizin ve dosya adına sahiptir; yapı eşitliği content/parity.test.ts ile zorunlu kılınır.
import lesson_0_1 from "./en/worlds/00-isinma/0.1-problem-ve-cozum.json";
import lesson_0_2 from "./en/worlds/00-isinma/0.2-algoritma-tanimi.json";
import lesson_0_3 from "./en/worlds/00-isinma/0.3-gunluk-hayattan-algoritmalar.json";
import lesson_0_4 from "./en/worlds/00-isinma/0.4-adim-sirasi.json";
import lesson_1_1 from "./en/worlds/01-temel-yapi-taslari/1.1-degisken-kavrami.json";
import lesson_1_2 from "./en/worlds/01-temel-yapi-taslari/1.2-veri-tipleri.json";
import lesson_1_3 from "./en/worlds/01-temel-yapi-taslari/1.3-atama-islemi.json";
import lesson_1_4 from "./en/worlds/01-temel-yapi-taslari/1.4-aritmetik-operatorler.json";
import lesson_1_5 from "./en/worlds/01-temel-yapi-taslari/1.5-girdi-ve-cikti.json";
import lesson_1_6 from "./en/worlds/01-temel-yapi-taslari/1.6-sabitler-ve-ifadeler.json";
import lesson_1_7 from "./en/worlds/01-temel-yapi-taslari/1.7-degisken-takasi.json";
import lesson_1_8 from "./en/worlds/01-temel-yapi-taslari/1.8-kontrol-noktasi.json";
import lesson_2_1 from "./en/worlds/02-akis-semasi/2.1-sema-sembolleri.json";
import lesson_2_2 from "./en/worlds/02-akis-semasi/2.2-basit-dogrusal-sema.json";
import lesson_2_3 from "./en/worlds/02-akis-semasi/2.3-semadan-sozde-koda.json";
import lesson_2_4 from "./en/worlds/02-akis-semasi/2.4-sik-yapilan-sema-hatalari.json";
import lesson_2_5 from "./en/worlds/02-akis-semasi/2.5-sema-cizme-atolyesi.json";
import lesson_2_6 from "./en/worlds/02-akis-semasi/2.6-kontrol-noktasi.json";
import lesson_3_1 from "./en/worlds/03-karar-yapilari/3.1-karsilastirma-operatorleri.json";
import lesson_3_2 from "./en/worlds/03-karar-yapilari/3.2-eger-degilse.json";
import lesson_3_3 from "./en/worlds/03-karar-yapilari/3.3-ic-ice-kararlar.json";
import lesson_3_4 from "./en/worlds/03-karar-yapilari/3.4-mantiksal-operatorler.json";
import lesson_3_5 from "./en/worlds/03-karar-yapilari/3.5-coklu-secim.json";
import lesson_3_6 from "./en/worlds/03-karar-yapilari/3.6-karar-hatalari.json";
import lesson_3_7 from "./en/worlds/03-karar-yapilari/3.7-kontrol-noktasi.json";
import lesson_4_1 from "./en/worlds/04-donguler/4.1-tekrar-ihtiyaci.json";
import lesson_4_2 from "./en/worlds/04-donguler/4.2-sayacli-dongu.json";
import lesson_4_3 from "./en/worlds/04-donguler/4.3-kosullu-dongu.json";
import lesson_4_4 from "./en/worlds/04-donguler/4.4-do-while.json";
import lesson_4_5 from "./en/worlds/04-donguler/4.5-sayac-ve-toplayici.json";
import lesson_4_6 from "./en/worlds/04-donguler/4.6-sonsuz-dongu.json";
import lesson_4_7 from "./en/worlds/04-donguler/4.7-ic-ice-donguler.json";
import lesson_4_8 from "./en/worlds/04-donguler/4.8-dongu-izleme-tablosu.json";
import lesson_4_9 from "./en/worlds/04-donguler/4.9-kontrol-noktasi.json";
import lesson_5_1 from "./en/worlds/05-veri-ve-modulerlik/5.1-dizi-kavrami.json";
import lesson_5_2 from "./en/worlds/05-veri-ve-modulerlik/5.2-dizide-gezinme.json";
import lesson_5_3 from "./en/worlds/05-veri-ve-modulerlik/5.3-dizide-arama.json";
import lesson_5_4 from "./en/worlds/05-veri-ve-modulerlik/5.4-en-buyuk-en-kucuk.json";
import lesson_5_5 from "./en/worlds/05-veri-ve-modulerlik/5.5-iki-boyutlu-diziler.json";
import lesson_5_6 from "./en/worlds/05-veri-ve-modulerlik/5.6-fonksiyon-altprogram.json";
import lesson_5_7 from "./en/worlds/05-veri-ve-modulerlik/5.7-degisken-kapsami.json";
import lesson_5_8 from "./en/worlds/05-veri-ve-modulerlik/5.8-kontrol-noktasi.json";
import lesson_6_1 from "./en/worlds/06-algoritma-dusuncesi/6.1-kabarcik-siralama.json";
import lesson_6_2 from "./en/worlds/06-algoritma-dusuncesi/6.2-secmeli-siralama.json";
import lesson_6_3 from "./en/worlds/06-algoritma-dusuncesi/6.3-ikili-arama.json";
import lesson_6_4 from "./en/worlds/06-algoritma-dusuncesi/6.4-ozyineleme.json";
import lesson_6_5 from "./en/worlds/06-algoritma-dusuncesi/6.5-karmasiklik-ve-strateji.json";

const RAW_LESSONS: unknown[] = [
  lesson_0_1,
  lesson_0_2,
  lesson_0_3,
  lesson_0_4,
  lesson_1_1,
  lesson_1_2,
  lesson_1_3,
  lesson_1_4,
  lesson_1_5,
  lesson_1_6,
  lesson_1_7,
  lesson_1_8,
  lesson_2_1,
  lesson_2_2,
  lesson_2_3,
  lesson_2_4,
  lesson_2_5,
  lesson_2_6,
  lesson_3_1,
  lesson_3_2,
  lesson_3_3,
  lesson_3_4,
  lesson_3_5,
  lesson_3_6,
  lesson_3_7,
  lesson_4_1,
  lesson_4_2,
  lesson_4_3,
  lesson_4_4,
  lesson_4_5,
  lesson_4_6,
  lesson_4_7,
  lesson_4_8,
  lesson_4_9,
  lesson_5_1,
  lesson_5_2,
  lesson_5_3,
  lesson_5_4,
  lesson_5_5,
  lesson_5_6,
  lesson_5_7,
  lesson_5_8,
  lesson_6_1,
  lesson_6_2,
  lesson_6_3,
  lesson_6_4,
  lesson_6_5,
];

export const enContent = createContent(RAW_LESSONS, "en");
