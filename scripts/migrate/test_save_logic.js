/* saveWorkToDb / softDeleteWork 의 분기를 가짜 Supabase 클라이언트로 검증한다.
   실제 DB를 건드리지 않고 신규/수정/충돌/다중에디션 경로를 모두 통과시킨다. */
const fs = require('fs');
const REPO = "C:\\Users\\yoons\\AppData\\Local\\Temp\\claude\\C--Users-yoons-Desktop-----------------mockup-shinhaedal-site-repo\\a0d1eca8-b288-4830-9ac4-64d04d6ec2cb\\scratchpad\\Haedalarchive";
const src = fs.readFileSync(REPO + "\\admin.html", "utf-8");

function grab(name){
  let i = src.indexOf("function " + name);
  if(i < 0) throw new Error("not found: " + name);
  // async 함수는 'async ' 접두사까지 포함해야 await가 유효하다
  if(src.slice(Math.max(0, i - 6), i) === "async ") i -= 6;
  let d = 0, st = false, j = i;
  for(; j < src.length; j++){
    if(src[j] === '{'){ d++; st = true; }
    else if(src[j] === '}'){ d--; if(st && d === 0){ j++; break; } }
  }
  return src.slice(i, j);
}
var sb;
const SOLD_TO_STATUS = eval("(" + src.match(/var SOLD_TO_STATUS = (\{[^}]*\});/)[1] + ")");
// 콜백 안에서 eval하면 함수가 그 스코프에만 남는다. 한 번에 모아서 평가한다.
eval(["numOrNull","rateOrNull","dateOrNull","textOrNull","parseSize","recToWork","recToEdition",
      "conflictError","saveWorkToDb","softDeleteWork"].map(grab).join("\n"));

/* ── 가짜 Supabase ── */
let calls = [];
function makeSb(opts){
  opts = opts || {};
  return {
    from(table){
      const ctx = { table, filters: {} };
      const api = {
        insert(payload){ ctx.op = 'insert'; ctx.payload = payload; return api; },
        update(payload){ ctx.op = 'update'; ctx.payload = payload; return api; },
        eq(col, val){ ctx.filters[col] = val; return api; },
        select(){ ctx.selected = true; return api; },
        single(){ ctx.single = true; return api; },
        then(res){
          calls.push(JSON.parse(JSON.stringify(ctx)));
          let out;
          if(ctx.op === 'insert'){
            out = opts.insertError
              ? { error: { message: opts.insertError } }
              : { data: { id: 'new-work-id' }, error: null };
          } else {
            const affected = (opts.conflictOn === ctx.table) ? [] : [{ id: ctx.filters.id }];
            out = { data: affected, error: null };
          }
          return Promise.resolve(out).then(res);
        }
      };
      return api;
    }
  };
}

let P = 0, F = 0;
const ck = (n, c, e) => { c ? (P++, console.log("  ok  " + n)) : (F++, console.log("  FAIL " + n + (e !== undefined ? " :: " + JSON.stringify(e) : ""))); };

const REC = { no:"HD-2026-020", title:"새 작품", title_en:"New Work", caption:"설명",
  caption_en:"Desc", material:"목심나전칠기", material_en:"Wood core", size:"30 × 30",
  year:"2026", price:"500000", sold:"", note:"메모", image:"drive:ABC", qty:"",
  actual_price:"", discount:"", payment:"", channel:"", owner:"", sale_date:"", delivery_date:"" };

(async () => {
  console.log("[1] 신규 등록 — works 넣고 이어서 edition 1을 만든다");
  calls = []; sb = makeSb();
  await saveWorkToDb(REC, true, null);
  ck("works insert 1회", calls.filter(c => c.table==='works' && c.op==='insert').length === 1);
  ck("editions insert 1회", calls.filter(c => c.table==='editions' && c.op==='insert').length === 1);
  const ed = calls.find(c => c.table==='editions');
  ck("에디션 번호 1", ed.payload.edition_number === 1, ed.payload.edition_number);
  ck("에디션이 새 작품에 연결", ed.payload.work_id === 'new-work-id');
  ck("상태 available", ed.payload.status === 'available');

  console.log("\n[2] 작품번호 중복");
  calls = []; sb = makeSb({ insertError: 'duplicate key value violates unique constraint' });
  let msg = "";
  try { await saveWorkToDb(REC, true, null); } catch(e){ msg = e.message; }
  ck("중복 안내 메시지", msg.indexOf('이미 존재하는 작품번호') >= 0, msg);

  console.log("\n[3] 유일작 수정 — works와 edition 1을 함께 갱신");
  calls = []; sb = makeSb();
  const cur1 = { _id:'w1', _version:5, _editions:[{ id:'e1', version:2, edition_number:1 }] };
  await saveWorkToDb(REC, false, cur1);
  const wu = calls.find(c => c.table==='works' && c.op==='update');
  ck("works update", !!wu);
  ck("version 조건 포함", wu.filters.version === 5, wu.filters);
  const eu = calls.find(c => c.table==='editions' && c.op==='update');
  ck("edition도 갱신", !!eu && eu.filters.id === 'e1');

  console.log("\n[4] 에디션 여러 점 — 판매정보를 이 폼으로 덮어쓰지 않는다");
  calls = []; sb = makeSb();
  const cur3 = { _id:'w2', _version:1, _editions:[
    { id:'a', version:1, edition_number:1 }, { id:'b', version:1, edition_number:2 },
    { id:'c', version:1, edition_number:3 } ] };
  await saveWorkToDb(REC, false, cur3);
  ck("works는 갱신됨", calls.some(c => c.table==='works' && c.op==='update'));
  ck("editions는 손대지 않음", !calls.some(c => c.table==='editions'),
     calls.filter(c => c.table==='editions').length);

  console.log("\n[5] 동시 수정 충돌 — 덮어쓰지 않고 멈춘다");
  calls = []; sb = makeSb({ conflictOn: 'works' });
  msg = "";
  try { await saveWorkToDb(REC, false, cur1); } catch(e){ msg = e.message; }
  ck("충돌 안내", msg.indexOf('다른 곳에서 수정') >= 0, msg);
  ck("충돌 시 edition 갱신 안 함", !calls.some(c => c.table==='editions' && c.op==='update'));

  console.log("\n[6] 에디션 쪽 충돌");
  calls = []; sb = makeSb({ conflictOn: 'editions' });
  msg = "";
  try { await saveWorkToDb(REC, false, cur1); } catch(e){ msg = e.message; }
  ck("에디션 충돌도 잡힘", msg.indexOf('다른 곳에서 수정') >= 0, msg);

  console.log("\n[7] 필수값 검증");
  sb = makeSb();
  msg = ""; try { await saveWorkToDb(Object.assign({}, REC, {title:""}), true, null); } catch(e){ msg = e.message; }
  ck("작품명 없으면 거부", msg.indexOf('작품명') >= 0, msg);
  msg = ""; try { await saveWorkToDb(Object.assign({}, REC, {no:""}), true, null); } catch(e){ msg = e.message; }
  ck("작품번호 없으면 거부", msg.indexOf('작품번호') >= 0, msg);
  msg = ""; try { await saveWorkToDb(Object.assign({}, REC, {no:"", sold:"등록 예정"}), true, null); } catch(e){ msg = e.message; }
  ck("등록 예정은 번호 생략 허용", msg === "", msg);

  console.log("\n[8] 소프트 삭제 — 행을 지우지 않고 표시만 한다");
  calls = []; sb = makeSb();
  await softDeleteWork(cur1);
  const del = calls.find(c => c.table==='works');
  ck("update로 처리(하드삭제 아님)", del.op === 'update');
  ck("deleted_at 설정", !!del.payload.deleted_at);
  ck("version 조건 포함", del.filters.version === 5);

  calls = []; sb = makeSb({ conflictOn: 'works' });
  msg = ""; try { await softDeleteWork(cur1); } catch(e){ msg = e.message; }
  ck("삭제도 충돌 감지", msg.indexOf('다른 곳에서 수정') >= 0, msg);

  console.log("\n== pass: " + P + ", fail: " + F + " ==");
  process.exit(F ? 1 : 0);
})();
