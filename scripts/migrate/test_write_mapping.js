/* admin.html의 폼→DB 매핑 함수를 브라우저 없이 검증한다.
   실제 DB에 쓰기 전에 값 변환이 맞는지 확인하는 단계. */
const fs = require('fs');
const REPO = "C:\\Users\\yoons\\AppData\\Local\\Temp\\claude\\C--Users-yoons-Desktop-----------------mockup-shinhaedal-site-repo\\a0d1eca8-b288-4830-9ac4-64d04d6ec2cb\\scratchpad\\Haedalarchive";
const src = fs.readFileSync(REPO + "\\admin.html", "utf-8");

function grab(name){
  const i = src.indexOf("function " + name);
  if(i < 0) throw new Error("not found: " + name);
  let d = 0, started = false, j = i;
  for(; j < src.length; j++){
    if(src[j] === '{'){ d++; started = true; }
    else if(src[j] === '}'){ d--; if(started && d === 0){ j++; break; } }
  }
  return src.slice(i, j);
}
const SOLD_TO_STATUS = eval("(" + src.match(/var SOLD_TO_STATUS = (\{[^}]*\});/)[1] + ")");
eval(grab("numOrNull")); eval(grab("rateOrNull")); eval(grab("dateOrNull"));
eval(grab("textOrNull")); eval(grab("parseSize"));
eval(grab("recToWork")); eval(grab("recToEdition"));

let P = 0, F = 0;
const ck = (n, c, e) => { c ? (P++, console.log("  ok  " + n)) : (F++, console.log("  FAIL " + n + (e !== undefined ? " :: " + JSON.stringify(e) : ""))); };

console.log("[숫자]");
ck("일반", numOrNull("650000") === 650000);
ck("콤마 제거", numOrNull("1,000,000") === 1000000);
ck("빈칸 → null", numOrNull("") === null);
ck("대시 → null", numOrNull("-") === null);
ck("텍스트 → null", numOrNull("Artist Archive") === null);
ck("0 보존", numOrNull("0") === 0);

console.log("\n[할인률]");
ck("0.2", rateOrNull("0.2") === 0.2);
ck("20% → 0.2", rateOrNull("20%") === 0.2);
ck("20 → 0.2", rateOrNull("20") === 0.2);
ck("0 유지", rateOrNull("0") === 0);
ck("대시 → null", rateOrNull("-") === null);

console.log("\n[날짜]");
ck("ISO", dateOrNull("2026-03-21") === "2026-03-21");
ck("점 표기", dateOrNull("2026.05.17") === "2026-05-17");
ck("한자리 월일 보정", dateOrNull("2026.5.7") === "2026-05-07");
ck("빈칸", dateOrNull("") === null);
ck("잘못된 월", dateOrNull("2026-13-01") === null);

console.log("\n[크기]");
let s = parseSize("27.3 × 27.3");
ck("2D", s.text === "27.3 × 27.3" && s.w === 27.3 && s.h === 27.3 && s.d === null, s);
s = parseSize("10 × 9 × 6");
ck("3D", s.w === 10 && s.h === 9 && s.d === 6, s);
s = parseSize("A1 (59.4 × 84.1)");
ck("규격지 원문 보존", s.text === "A1 (59.4 × 84.1)", s.text);
ck("규격지 수치 추출", s.w === 59.4 && s.h === 84.1, s);
s = parseSize("");
ck("빈칸", s.text === null && s.w === null, s);

console.log("\n[작품 매핑]");
const rec = {
  no: "HD-2026-020", title: "새 작품", title_en: "New Work",
  caption: "설명", caption_en: "Description",
  material: "목심나전칠기", material_en: "Najeonchilgi on wood core",
  size: "30 × 30", year: "2026", price: "500,000", sold: "",
  note: "메모", image: "drive:ABC123", qty: ""
};
let w = recToWork(rec);
ck("work_no", w.work_no === "HD-2026-020");
ck("제목 분리 저장", w.title_ko === "새 작품" && w.title_en === "New Work");
ck("캡션 분리", w.caption_ko === "설명" && w.caption_en === "Description");
ck("재료 분리", w.material_ko === "목심나전칠기" && w.material_en === "Najeonchilgi on wood core");
ck("가격 콤마 처리", w.list_price_krw === 500000);
ck("이미지 보존", w.image_file === "drive:ABC123");
ck("에디션 기본 1", w.edition_size === 1);
ck("상태 completed", w.work_state === "completed");
ck("크기 수치", w.width_cm === 30 && w.height_cm === 30);

console.log("\n[등록 예정]");
w = recToWork(Object.assign({}, rec, { sold: "등록 예정" }));
ck("work_state=planned", w.work_state === "planned", w.work_state);

console.log("\n[에디션 매핑]");
let e = recToEdition({ sold: "●", actual_price: "400,000", discount: "0.2",
                       payment: "현금", channel: "직거래", owner: "홍길동",
                       sale_date: "2026.05.17", delivery_date: "2026-07-07" });
ck("판매완료", e.status === "sold");
ck("실거래가", e.actual_price_krw === 400000);
ck("할인률", e.discount_rate === 0.2);
ck("소장자", e.collector_name === "홍길동");
ck("판매일 정규화", e.sale_date === "2026-05-17", e.sale_date);
ck("인도일", e.delivery_date === "2026-07-07");

e = recToEdition({ sold: "NFS" });
ck("NFS", e.status === "nfs");
ck("빈 필드는 null", e.collector_name === null && e.sale_date === null);

e = recToEdition({ sold: "" });
ck("빈칸 → available", e.status === "available");

console.log("\n[빈 값이 빈 문자열로 새지 않는가]");
w = recToWork({ no: "X", title: "T", title_en: "", caption: "", material: "",
                size: "", year: "", price: "", note: "", image: "" });
const emptyStr = Object.entries(w).filter(([k, v]) => v === "");
ck("빈 문자열 없음(전부 null)", emptyStr.length === 0, emptyStr);

console.log("\n== pass: " + P + ", fail: " + F + " ==");
process.exit(F ? 1 : 0);
