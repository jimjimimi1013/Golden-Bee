import { useEffect, useState } from "react";
import { Check, Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "./lib/supabase";

export default function GoldenBeeTimeline() {
  const [tasks, setTasks] = useState([]);
  const [phaseData, setPhaseData] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

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

  async function loadTasks() {
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
  }

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
      <div className={`flex items-center gap-1 shrink-0 ${item.done ? "opacity-40" : ""}`}>
        {["김지아", "윤재성"].map((owner) => {
          const active = (item.owners || []).includes(owner);
          return (
            <button
              key={owner}
              type="button"
              onClick={() => toggleOwner(phaseIndex, itemIndex, owner, bucket)}
              className={`rounded-md border px-2 py-0.5 text-[11px] ${
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
      <ul className="space-y-1.5 mb-4 text-sm leading-6">
        {items.map((item, i) => (
          <li key={item.id ?? i} className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => toggleDone(phaseIndex, i, bucket)}
              className="mt-1 shrink-0"
            >
              <Check className={`w-4 h-4 ${item.done ? "opacity-100" : "opacity-30"}`} />
            </button>
            <div className="flex-1 min-w-0 flex items-start gap-3">
              <div className={`flex-1 ${item.done ? "line-through opacity-40" : ""}`}>
                {item.text}
              </div>
              {renderOwnerButtons(item, phaseIndex, i, bucket)}
            </div>
            <button
              type="button"
              onClick={() => editItem(phaseIndex, i, item.text, bucket)}
              className="text-gray-600 hover:text-black"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => deleteItem(phaseIndex, i, bucket)}
              className="text-gray-600 hover:text-black"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => addItem(phaseIndex, bucket)}
        className="mt-2 flex items-center gap-1 text-xs border rounded-lg px-2 py-1 hover:bg-gray-100 bg-white"
      >
        <Plus className="w-3 h-3" /> 항목 추가
      </button>
    </>
  );

  const renderEvent = (phase, key, phaseIndex) => (
    <div key={key} className="relative pl-7">
      <div className="absolute -left-[12px] top-2 w-5 h-5 rounded-full border-4 border-black bg-yellow-400" />
      <div className="bg-yellow-100 rounded-2xl shadow-sm p-4 border-2 border-yellow-500">
        <div className="text-xs font-semibold text-yellow-700 mb-1">{phase.title}</div>
        <h2 className="text-xl font-bold mb-3 text-yellow-900">{phase.subtitle}</h2>
        <ul className="space-y-1.5 mb-4 text-sm leading-6">
          {phase.items.map((item, i) => (
            <li key={item.id ?? i} className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <div className="flex-1">{item.text}</div>
              <button
                type="button"
                onClick={() => editItem(phaseIndex, i, item.text, "items")}
                className="text-gray-600 hover:text-black"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteItem(phaseIndex, i, "items")}
                className="text-gray-600 hover:text-black"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => addItem(phaseIndex, "items")}
          className="mt-2 flex items-center gap-1 text-xs border rounded-lg px-2 py-1 hover:bg-yellow-200 bg-white"
        >
          <Plus className="w-3 h-3" /> 항목 추가
        </button>
      </div>
    </div>
  );

  const renderPhase = (phase, key, phaseIndex) => (
    <div key={key} className="relative pl-7">
      <div className="absolute -left-[12px] top-2 w-5 h-5 rounded-full border-4 border-black bg-white" />
      <div className="bg-gray-50 rounded-2xl shadow-sm p-4 border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 mb-1">{phase.title}</div>
        <h2 className="text-xl font-bold mb-3">{phase.subtitle}</h2>
        {renderChecklist(phase.items, phaseIndex, "items")}
        <div className="mt-4 border-t pt-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">기타 업무</div>
          {renderChecklist(phase.extraItems || [], phaseIndex, "extraItems")}
        </div>
        <div className="mt-3 inline-block px-3 py-1.5 rounded-xl border border-black text-xs font-semibold">
          {phase.highlight}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-4">
        <button
          onClick={addTestTask}
          className="mb-4 rounded-lg border border-black px-3 py-2 text-sm font-semibold"
        >
          테스트 추가
        </button>

        <button
          onClick={seedInitialData}
          className="mb-4 ml-2 rounded-lg border border-black px-3 py-2 text-sm font-semibold"
        >
          초기 데이터 업로드
        </button>

        <div className="text-xs text-gray-500 mb-4">
          Supabase 테스트 데이터 수: {tasks.length}
        </div>
      </div>

      <div className="min-h-screen bg-white p-5 font-sans">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">더 골든비 신규 쇼핑몰 구축 타임라인</h1>
          <p className="text-base mb-6 text-gray-600">목표 오픈: 6월 15일 / 안정 오픈: 6월 말</p>

          <div className="relative border-l-4 border-black ml-3 space-y-6">
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