import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "./lib/supabase";

export default function GoldenBeeTimeline() {
  const [tasks, setTasks] = useState([]);
  const [phaseData, setPhaseData] = useState([]);

  function buildPhaseDataFromTasks(taskRows) {
    const grouped = {};

    taskRows.forEach((row) => {
      const key = `${row.phase_title}__${row.phase_subtitle}__${row.phase_type}`;

      if (!grouped[key]) {
        grouped[key] = {
          type: row.phase_type,
          title: row.phase_title,
          subtitle: row.phase_subtitle,
          items: [],
          extraItems: [],
          highlight: row.highlight || "",
        };
      }

      const item = {
        id: row.id,
        text: row.text,
        done: row.done ?? false,
        owners: row.owners ?? [],
      };

      if (row.bucket === "extraItems") {
        grouped[key].extraItems.push(item);
      } else {
        grouped[key].items.push(item);
      }
    });

    return Object.values(grouped);
  }

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("order_index", { ascending: true });

    if (!error) {
      const rows = data || [];
      setTasks(rows);
      setPhaseData(buildPhaseDataFromTasks(rows));
    } else {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function addTestTask() {
    const { data, error } = await supabase.from("tasks").insert({
      phase_title: "테스트 단계",
      phase_type: "phase",
      phase_subtitle: "Supabase 연결 확인",
      bucket: "items",
      text: "테스트 작업",
      done: false,
      owners: ["김지아"],
      highlight: "테스트",
      order_index: 9999,
    });

    console.log("insert result:", data, error);

    if (error) {
      alert(error.message);
      return;
    }

    loadTasks();
  }

 async function seedInitialData() {
  if (tasks.length > 0) {
    alert("이미 데이터가 있습니다.");
    return;
  }

    const seedData = [
      {
        type: "phase",
        title: "4월 중순 ~ 4월 말",
        subtitle: "내부 진행: 개발사 선정 및 사전 준비",
        items: [
          { text: "전체 일정 대표 공유 및 컨펌", done: false, owners: [] },
          { text: "위피엔피 포함 타업체 견적 비교", done: false, owners: [] },
          { text: "타업체 견적 및 위피엔피 견적 비교 후, 피드백 수령 시 공유", done: false, owners: [] },
          { text: "개발 범위 확정", done: false, owners: [] },
          { text: "독점 사용 계약 가능 여부 협의", done: false, owners: [] },
          { text: "소스코드 귀속 / 재사용 제한 범위 확인", done: false, owners: [] },
          { text: "계약금 조건 협의", done: false, owners: [] },
          { text: "최종 개발업체 선정", done: false, owners: [] },
          { text: "카페24 스킨 추가 수정 마무리", done: false, owners: [] },
          { text: "상세페이지 제작 촬영 기획", done: false, owners: [] },
          { text: "영상 제작 촬영 기획 (사장님 레퍼런스 전달 예정)", done: false, owners: [] },
        ],
        extraItems: [
          { text: "더 골든비 스티커 발주 진행", done: false, owners: [] },
        ],
        highlight: "4월 내 개발사 확정 필수",
      },
      {
        type: "event",
        title: "4월 말 ~ 5월 초",
        subtitle: "중간 점검 미팅",
        items: [
          { text: "상세페이지 / 영상 기획안 컨펌" },
          { text: "개발 진행상황 체크 및 일정 점검" },
        ],
        extraItems: [],
        highlight: "",
      },
      {
        type: "phase",
        title: "5월 초 ~ 5월 말",
        subtitle: "개발 진행 (외부업체) + 내부 제작 병행",
        items: [
          { text: "[외부업체] 실시간 미리보기 / PDF 자동생성 기능 개발", done: false, owners: [] },
          { text: "[외부업체] 카페24 주문 연동", done: false, owners: [] },
          { text: "[외부업체] 카톡·문자 자동발송 연동", done: false, owners: [] },
          { text: "[외부업체] 고정 문구(핵심 타이틀)의 색상 및 질감 변경 기능 개발", done: false, owners: [] },
          { text: "[내부] 상세페이지 제작 진행 / 완료", done: false, owners: [] },
          { text: "[내부] 제품 촬영 진행", done: false, owners: [] },
          { text: "[내부] 영상 제작 진행 / 완료", done: false, owners: [] },
        ],
        extraItems: [
          { text: "SNS 광고 레퍼런스 조사 및 방향 제안", done: false, owners: [] },
        ],
        highlight: "5월은 개발 완료 + 내부 제작 병행 핵심",
      },
      {
        type: "phase",
        title: "6월 초",
        subtitle: "통합 테스트 및 수정",
        items: [
          { text: "기능 QA 테스트", done: false, owners: [] },
          { text: "주문 → PDF 생성 검수", done: false, owners: [] },
          { text: "모바일 / 실주문 테스트", done: false, owners: [] },
          { text: "오류 수정 반영", done: false, owners: [] },
        ],
        extraItems: [],
        highlight: "실사용 검증 단계",
      },
      {
        type: "phase",
        title: "6월 초 ~ 6월 15일",
        subtitle: "오픈 준비 및 1차 목표 런칭",
        items: [
          { text: "최종 상품 등록 점검", done: false, owners: [] },
          { text: "광고 콘텐츠 세팅", done: false, owners: [] },
          { text: "SNS 광고 시작", done: false, owners: [] },
          { text: "공식 오픈", done: false, owners: [] },
        ],
        extraItems: [],
        highlight: "1차 목표: 6월 15일 오픈 (예비 버퍼: 6월 말)",
      },
    ];

    const rows = [];
    let order = 1;

    seedData.forEach((phase) => {
      (phase.items || []).forEach((item) => {
        rows.push({
          phase_title: phase.title,
          phase_type: phase.type,
          phase_subtitle: phase.subtitle,
          bucket: "items",
          text: item.text,
          done: item.done ?? false,
          owners: item.owners ?? [],
          highlight: phase.highlight ?? "",
          order_index: order++,
        });
      });

      (phase.extraItems || []).forEach((item) => {
        rows.push({
          phase_title: phase.title,
          phase_type: phase.type,
          phase_subtitle: phase.subtitle,
          bucket: "extraItems",
          text: item.text,
          done: item.done ?? false,
          owners: item.owners ?? [],
          highlight: phase.highlight ?? "",
          order_index: order++,
        });
      });
    });

    const { error } = await supabase.from("tasks").insert(rows);

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

     alert("초기 데이터 업로드 완료");
    loadTasks();
  }
const toggleDone = async (phaseIndex, itemIndex, bucket = "items") => {
  const targetItem = phaseData[phaseIndex]?.[bucket]?.[itemIndex];
  if (!targetItem) return;

  const { error } = await supabase
    .from("tasks")
    .update({ done: !targetItem.done })
    .eq("id", targetItem.id);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

const addItem = async (phaseIndex, bucket = "items") => {
  const text = window.prompt("추가할 항목 입력");
  if (!text) return;

  const phase = phaseData[phaseIndex];
  if (!phase) return;

  const { error } = await supabase.from("tasks").insert({
    phase_title: phase.title,
    phase_type: phase.type,
    phase_subtitle: phase.subtitle,
    bucket,
    text,
    done: false,
    owners: [],
    highlight: phase.highlight ?? "",
    order_index: 9999,
  });

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

  const editItem = async (phaseIndex, itemIndex, currentText, bucket = "items") => {
  const text = window.prompt("항목 수정", currentText);
  if (!text) return;

  const targetItem = phaseData[phaseIndex]?.[bucket]?.[itemIndex];
  if (!targetItem) return;

  const { error } = await supabase
    .from("tasks")
    .update({ text })
    .eq("id", targetItem.id);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

const deleteItem = async (phaseIndex, itemIndex, bucket = "items") => {
  const targetItem = phaseData[phaseIndex]?.[bucket]?.[itemIndex];
  if (!targetItem) return;

  const ok = window.confirm("이 항목을 삭제할까요?");
  if (!ok) return;

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", targetItem.id);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

  const toggleOwner = async (phaseIndex, itemIndex, owner, bucket = "items") => {
  const targetItem = phaseData[phaseIndex]?.[bucket]?.[itemIndex];
  if (!targetItem) return;

  const currentOwners = targetItem.owners || [];
  const newOwners = currentOwners.includes(owner)
    ? currentOwners.filter((o) => o !== owner)
    : [...currentOwners, owner];

  const { error } = await supabase
    .from("tasks")
    .update({ owners: newOwners })
    .eq("id", targetItem.id);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

  const renderOwnerButtons = (item, phaseIndex, itemIndex, bucket) => {
    if (!("owners" in item)) return null;

    return (
      <div
        className={`flex flex-wrap items-center gap-1.5 shrink-0 ${
          item.done ? "opacity-40" : ""
        }`}
      >
        {["김지아", "윤재성"].map((owner) => {
          const active = (item.owners || []).includes(owner);
          return (
            <button
              key={owner}
              type="button"
              onClick={() => toggleOwner(phaseIndex, itemIndex, owner, bucket)}
              className={`min-h-8 rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {owner}
            </button>
          );
        })}
      </div>
    );
  };

  const renderChecklist = (items, phaseIndex, bucket = "items") => (
    <>
      <ul className="mb-4 space-y-2 text-sm leading-6 sm:space-y-1.5">
        {items.map((item, i) => (
          <li
            key={item.id ?? i}
            className="rounded-xl border border-gray-200 bg-white/80 p-3 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => toggleDone(phaseIndex, i, bucket)}
              className="mt-0.5 shrink-0 rounded-md p-1 -ml-1"
            >
              <Check className={`h-4 w-4 ${item.done ? "opacity-100" : "opacity-30"}`} />
            </button>
            <div className="min-w-0 flex-1">
              <div
                className={`break-words pr-1 text-[15px] leading-6 sm:text-sm ${
                  item.done ? "line-through opacity-40" : ""
                }`}
              >
                {item.text}
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                {renderOwnerButtons(item, phaseIndex, i, bucket)}
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => editItem(phaseIndex, i, item.text, bucket)}
                    className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                    aria-label="항목 수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(phaseIndex, i, bucket)}
                    className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                    aria-label="항목 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => addItem(phaseIndex, bucket)}
        className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-100 sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
      >
        <Plus className="h-3 w-3" /> 항목 추가
      </button>
    </>
  );

  const renderEvent = (phase, key, phaseIndex) => (
    <div key={key} className="relative pl-5 sm:pl-7">
      <div className="absolute -left-[10px] top-2 h-4 w-4 rounded-full border-[3px] border-black bg-yellow-400 sm:-left-[12px] sm:h-5 sm:w-5 sm:border-4" />
      <div className="rounded-2xl border-2 border-yellow-500 bg-yellow-100 p-4 shadow-sm sm:p-5">
        <div className="text-xs font-semibold text-yellow-700 mb-1">{phase.title}</div>
        <h2 className="mb-3 text-lg font-bold text-yellow-900 sm:text-xl">{phase.subtitle}</h2>
        <ul className="mb-4 space-y-2 text-sm leading-6 sm:space-y-1.5">
          {phase.items.map((item, i) => (
            <li
              key={item.id ?? i}
              className="rounded-xl border border-yellow-300/80 bg-white/70 p-3 sm:border-0 sm:bg-transparent sm:p-0"
            >
              <div className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <div className="min-w-0 flex-1">
                <div className="break-words pr-1 text-[15px] leading-6 sm:text-sm">{item.text}</div>
                <div className="mt-2 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => editItem(phaseIndex, i, item.text, "items")}
                    className="rounded-md p-2 text-gray-600 transition hover:bg-yellow-200/70 hover:text-black"
                    aria-label="항목 수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(phaseIndex, i, "items")}
                    className="rounded-md p-2 text-gray-600 transition hover:bg-yellow-200/70 hover:text-black"
                    aria-label="항목 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => addItem(phaseIndex, "items")}
          className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-yellow-200 sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
        >
          <Plus className="h-3 w-3" /> 항목 추가
        </button>
      </div>
    </div>
  );

  const renderPhase = (phase, key, phaseIndex) => (
    <div key={key} className="relative pl-5 sm:pl-7">
      <div className="absolute -left-[10px] top-2 h-4 w-4 rounded-full border-[3px] border-black bg-white sm:-left-[12px] sm:h-5 sm:w-5 sm:border-4" />
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-5">
        <div className="text-xs font-semibold text-gray-500 mb-1">{phase.title}</div>
        <h2 className="mb-3 text-lg font-bold leading-tight sm:text-xl">{phase.subtitle}</h2>
        {renderChecklist(phase.items, phaseIndex, "items")}
        <div className="mt-4 border-t pt-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">기타 업무</div>
          {renderChecklist(phase.extraItems || [], phaseIndex, "extraItems")}
        </div>
        <div className="mt-3 inline-block rounded-xl border border-black px-3 py-1.5 text-xs font-semibold leading-5">
          {phase.highlight}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="px-4 pt-4 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          onClick={addTestTask}
          className="min-h-11 rounded-lg border border-black px-3 py-2 text-sm font-semibold"
        >
          테스트 추가
        </button>

        <button
          onClick={seedInitialData}
          className="min-h-11 rounded-lg border border-black px-3 py-2 text-sm font-semibold"
        >
          초기 데이터 업로드
        </button>
        </div>

        <div className="mb-4 mt-3 text-xs text-gray-500 sm:mt-4">
          Supabase 테스트 데이터 수: {tasks.length}
        </div>
      </div>

      <div className="min-h-screen bg-white px-4 pb-8 pt-2 font-sans sm:p-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl">
            더 골든비 신규 쇼핑몰 구축 타임라인
          </h1>
          <p className="mb-5 text-sm text-gray-600 sm:mb-6 sm:text-base">
            목표 오픈: 6월 15일 / 안정 오픈: 6월 말
          </p>

          <div className="relative ml-2 space-y-4 border-l-4 border-black sm:ml-3 sm:space-y-6">
            {phaseData.map((phase, idx) =>
              phase.type === "event"
                ? renderEvent(phase, `phase-${idx}`, idx)
                : renderPhase(phase, `phase-${idx}`, idx)
            )}
          </div>
        </div>
      </div>
    </>
  );
}
