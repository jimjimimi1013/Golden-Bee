import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, Pencil, Star, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "./lib/supabase";

const MAIN_STATE_ID = "main";
const getPhaseKey = (phase) => `${phase.title}__${phase.subtitle}__${phase.type}`;

export default function GoldenBeeTimeline() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [memoText, setMemoText] = useState("");
  const [customEvents, setCustomEvents] = useState([]);
  const [infoCards, setInfoCards] = useState([]);
  const [phaseOrder, setPhaseOrder] = useState([]);
  const [sharedStateReady, setSharedStateReady] = useState(false);
  const ganttColumns = ["4월 중순", "4월 말", "5월 초", "5월 말", "6월 초", "6월 중순"];
  const ganttRows = [
    { label: "내부 준비 / 개발사 선정", bars: [0, 1], color: "bg-black" },
    { label: "상세 / 영상 기획", bars: [0, 1], color: "bg-gray-500" },
    { label: "중간 점검 미팅", bars: [1, 2], color: "bg-yellow-500" },
    { label: "외부 개발 진행", bars: [2, 3], color: "bg-gray-800" },
    { label: "내부 제작 병행", bars: [1, 2, 3], color: "bg-gray-500" },
    { label: "QA / 테스트", bars: [4], color: "bg-black" },
    { label: "오픈 준비 / 런칭", bars: [4, 5], color: "bg-yellow-500" },
  ];
  const tabs = [
    { id: "timeline", label: "타임라인" },
    { id: "gantt", label: "간트 + 메모" },
    { id: "trash", label: "휴지통" },
  ];

  function buildPhaseDataFromTasks(taskRows) {
    const grouped = {};

    taskRows.forEach((row) => {
      const key = getPhaseKey({
        title: row.phase_title,
        subtitle: row.phase_subtitle,
        type: row.phase_type,
      });

      if (!grouped[key]) {
        grouped[key] = {
          key,
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
        isImportant: row.is_important ?? false,
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
    } else {
      console.log(error);
    }
  }, []);

  const loadSharedState = useCallback(async () => {
    const [
      { data: events, error: eventsError },
      { data: state, error: stateError },
      { data: cards, error: cardsError },
    ] =
      await Promise.all([
        supabase.from("timeline_custom_events").select("*").order("created_at", { ascending: true }),
        supabase.from("timeline_state").select("*").eq("id", MAIN_STATE_ID).maybeSingle(),
        supabase
          .from("timeline_info_cards")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (eventsError) {
      console.log(eventsError);
    } else {
      setCustomEvents(
        (events || []).map((event) => ({
          key: `custom:${event.id}`,
          eventId: event.id,
          type: event.kind === "phase" ? "phase" : "event",
          title: event.title,
          subtitle: event.subtitle,
          items: event.note ? [{ id: `custom-note:${event.id}`, text: event.note, isImportant: false }] : [],
          extraItems: [],
          highlight: "",
          isCustom: true,
          kind: event.kind || "event",
        }))
      );
    }

    if (stateError) {
      console.log(stateError);
    } else {
      setMemoText(state?.memo || "");
      setPhaseOrder(state?.phase_order || []);
    }

    if (cardsError) {
      console.log(cardsError);
    } else {
      setInfoCards(cards || []);
    }

    setSharedStateReady(true);
  }, []);

  useEffect(() => {
    loadTasks();
    loadSharedState();
  }, [loadSharedState, loadTasks]);

  const phaseData = useMemo(
    () => buildPhaseDataFromTasks(tasks.filter((task) => !task.deleted_at)),
    [tasks]
  );

  const trashEntries = useMemo(
    () =>
      tasks
        .filter((task) => task.deleted_at)
        .sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0)),
    [tasks]
  );

  const orderedPhases = useMemo(() => {
    const phaseMap = new Map();

    phaseData.forEach((phase, index) => {
      phaseMap.set(phase.key, {
        ...phase,
        baseIndex: index,
        isCustom: false,
      });
    });

    customEvents.forEach((phase) => {
      phaseMap.set(phase.key, {
        ...phase,
        isCustom: true,
      });
    });

    const orderedKeys = [
      ...phaseOrder.filter((key) => phaseMap.has(key)),
      ...Array.from(phaseMap.keys()).filter((key) => !phaseOrder.includes(key)),
    ];

    return orderedKeys.map((key) => phaseMap.get(key));
  }, [customEvents, phaseData, phaseOrder]);

  useEffect(() => {
    if (!sharedStateReady) return;

    const timeoutId = window.setTimeout(async () => {
      const { error } = await supabase.from("timeline_state").upsert(
        {
          id: MAIN_STATE_ID,
          memo: memoText,
          phase_order: phaseOrder,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (error) {
        console.log(error);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [memoText, phaseOrder, sharedStateReady]);

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

  const ok = window.confirm("이 항목을 휴지통으로 보낼까요?");
  if (!ok) return;

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", targetItem.id);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

const restoreItem = async (itemId) => {
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: null })
    .eq("id", itemId);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

const toggleImportant = async (item) => {
  if (!item?.id) return;

  const { error } = await supabase
    .from("tasks")
    .update({ is_important: !item.isImportant })
    .eq("id", item.id);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  loadTasks();
};

const addCustomBox = async (kind) => {
  const isYellow = kind === "event";
  const title = window.prompt(
    isYellow
      ? "노란 일정 박스의 상단 기간/라벨을 입력해주세요."
      : "일반 박스의 상단 기간/라벨을 입력해주세요."
  );
  if (!title) return;

  const subtitle = window.prompt(
    isYellow ? "노란 일정 박스의 제목을 입력해주세요." : "일반 박스의 제목을 입력해주세요."
  );
  if (!subtitle) return;

  const note = window.prompt("박스 안에 넣을 설명을 입력해주세요. 비워도 됩니다.") || "";
  const { data, error } = await supabase
    .from("timeline_custom_events")
    .insert({ kind, title, subtitle, note })
    .select("*")
    .single();

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  const newEvent = {
    key: `custom:${data.id}`,
    eventId: data.id,
    type: data.kind === "phase" ? "phase" : "event",
    title: data.title,
    subtitle: data.subtitle,
    items: data.note ? [{ id: `custom-note:${data.id}`, text: data.note, isImportant: false }] : [],
    extraItems: [],
    highlight: "",
    isCustom: true,
    kind: data.kind,
  };

  setCustomEvents((prev) => [...prev, newEvent]);
  setPhaseOrder((prev) => [...prev, newEvent.key]);
};

const updateCustomBox = async (phaseKey) => {
  const targetEvent = customEvents.find((event) => event.key === phaseKey);
  if (!targetEvent) return;

  const nextTitle = window.prompt("상단 기간/라벨 수정", targetEvent.title);
  if (!nextTitle) return;

  const nextSubtitle = window.prompt("제목 수정", targetEvent.subtitle);
  if (!nextSubtitle) return;

  const currentNote = targetEvent.items?.[0]?.text || "";
  const nextNote = window.prompt("설명 수정", currentNote);

  const { error } = await supabase
    .from("timeline_custom_events")
    .update({ title: nextTitle, subtitle: nextSubtitle, note: nextNote || "" })
    .eq("id", targetEvent.eventId);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  setCustomEvents((prev) =>
    prev.map((event) =>
      event.key === phaseKey
        ? {
            ...event,
            title: nextTitle,
            subtitle: nextSubtitle,
            items: nextNote ? [{ id: `custom-note:${event.eventId}`, text: nextNote, isImportant: false }] : [],
          }
        : event
    )
  );
};

const removeCustomEvent = async (eventKey) => {
  const targetEvent = customEvents.find((event) => event.key === eventKey);
  if (!targetEvent) return;

  const ok = window.confirm(
    targetEvent.kind === "phase" ? "이 일반 박스를 삭제할까요?" : "이 노란 일정 박스를 삭제할까요?"
  );
  if (!ok) return;

  const { error } = await supabase
    .from("timeline_custom_events")
    .delete()
    .eq("id", targetEvent.eventId);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  setCustomEvents((prev) => prev.filter((event) => event.key !== eventKey));
  setPhaseOrder((prev) => prev.filter((key) => key !== eventKey));
};

const parseCardLines = (value) =>
  value
    .split("||")
    .map((line) => line.trim())
    .filter(Boolean);

const addInfoCard = async () => {
  const title = window.prompt("카드 제목을 입력해주세요.");
  if (!title) return;

  const linesInput = window.prompt(
    "본문을 입력해주세요. 여러 줄은 || 로 구분해주세요.\n예: 첫 줄 || 둘째 줄 || 셋째 줄"
  );
  const lines = parseCardLines(linesInput || "");
  if (lines.length === 0) return;

  const nextOrder = infoCards.length > 0 ? Math.max(...infoCards.map((card) => card.sort_order || 0)) + 1 : 1;
  const { data, error } = await supabase
    .from("timeline_info_cards")
    .insert({ title, lines, sort_order: nextOrder })
    .select("*")
    .single();

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  setInfoCards((prev) => [...prev, data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
};

const updateInfoCard = async (cardId) => {
  const targetCard = infoCards.find((card) => card.id === cardId);
  if (!targetCard) return;

  const nextTitle = window.prompt("카드 제목 수정", targetCard.title);
  if (!nextTitle) return;

  const nextLinesInput = window.prompt(
    "본문 수정. 여러 줄은 || 로 구분해주세요.",
    (targetCard.lines || []).join(" || ")
  );
  const nextLines = parseCardLines(nextLinesInput || "");
  if (nextLines.length === 0) return;

  const { error } = await supabase
    .from("timeline_info_cards")
    .update({ title: nextTitle, lines: nextLines })
    .eq("id", cardId);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  setInfoCards((prev) =>
    prev.map((card) => (card.id === cardId ? { ...card, title: nextTitle, lines: nextLines } : card))
  );
};

const deleteInfoCard = async (cardId) => {
  const ok = window.confirm("이 카드를 삭제할까요?");
  if (!ok) return;

  const { error } = await supabase.from("timeline_info_cards").delete().eq("id", cardId);

  if (error) {
    alert(error.message);
    console.log(error);
    return;
  }

  setInfoCards((prev) => prev.filter((card) => card.id !== cardId));
};

const reorderPhases = (nextKeys) => {
  setPhaseOrder(nextKeys);
};

const movePhaseByOffset = (phaseKey, offset) => {
  const currentKeys = orderedPhases.map((phase) => phase.key);
  const currentIndex = currentKeys.indexOf(phaseKey);
  const nextIndex = currentIndex + offset;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= currentKeys.length) return;

  const nextKeys = [...currentKeys];
  const [moved] = nextKeys.splice(currentIndex, 1);
  nextKeys.splice(nextIndex, 0, moved);
  reorderPhases(nextKeys);
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

  const renderImportantButton = (item, tone = "default") => {
    const active = Boolean(item?.isImportant);
    const hoverClass =
      tone === "yellow" ? "hover:bg-yellow-200/70" : "hover:bg-gray-100";

    return (
      <button
        type="button"
        onClick={() => toggleImportant(item)}
        className={`rounded-md p-2 text-gray-600 transition hover:text-black ${hoverClass} ${
          active ? "text-yellow-500" : ""
        }`}
        aria-label={active ? "중요 해제" : "중요 표시"}
        title={active ? "중요 해제" : "중요 표시"}
      >
        <Star className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
      </button>
    );
  };

  const renderPrioritySection = (phase) => {
    const importantPhaseItems = [...(phase.items || []), ...(phase.extraItems || [])].filter(
      (item) => item.isImportant
    );

    if (!phase.highlight && importantPhaseItems.length === 0) return null;

    return (
      <div className="mb-4 flex flex-wrap gap-2">
        {phase.highlight ? (
          <div className="inline-flex rounded-full border border-black px-3 py-1.5 text-xs font-semibold leading-5">
            {phase.highlight}
          </div>
        ) : null}
        {importantPhaseItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleImportant(item)}
            className="inline-flex items-center gap-1 rounded-full border border-yellow-500 bg-yellow-50 px-3 py-1.5 text-xs font-semibold leading-5 text-yellow-700"
            title="중요 해제"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            {item.text}
          </button>
        ))}
      </div>
    );
  };

  const renderMoveButtons = (phase) => {
    const currentIndex = orderedPhases.findIndex((item) => item.key === phase.key);
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex === orderedPhases.length - 1;

    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => movePhaseByOffset(phase.key, -1)}
          disabled={isFirst}
          className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="위로 이동"
          title="위로 이동"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => movePhaseByOffset(phase.key, 1)}
          disabled={isLast}
          className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="아래로 이동"
          title="아래로 이동"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderPhaseWrapper = (phase, content) => <div key={phase.key}>{content}</div>;

  const renderChecklist = (items, phaseIndex, bucket = "items") => (
    <>
      <ul className="mb-4 space-y-1.5 text-sm leading-6 max-[767px]:space-y-2">
        {items.map((item, i) => (
          <li
            key={item.id ?? i}
            className="max-[767px]:rounded-xl max-[767px]:border max-[767px]:border-gray-200 max-[767px]:bg-white/80 max-[767px]:p-3"
          >
            <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => toggleDone(phaseIndex, i, bucket)}
              className="mt-0.5 shrink-0 rounded-md p-1 -ml-1"
            >
              <Check className={`h-4 w-4 ${item.done ? "opacity-100" : "opacity-30"}`} />
            </button>
            <div className="min-w-0 flex flex-1 items-start gap-3 max-[767px]:block">
              <div
                className={`flex-1 break-words pr-1 ${
                  item.done ? "line-through opacity-40" : ""
                }`}
              >
                {item.text}
              </div>
              <div className="mt-2 hidden flex-col gap-2 max-[767px]:flex">
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
                  {renderImportantButton(item)}
                </div>
              </div>
              <div className="shrink-0 max-[767px]:hidden">
                {renderOwnerButtons(item, phaseIndex, i, bucket)}
              </div>
            </div>
            <div className="max-[767px]:hidden flex items-center gap-1">
              <button
                type="button"
                onClick={() => editItem(phaseIndex, i, item.text, bucket)}
                className="text-gray-600 hover:text-black"
                aria-label="항목 수정"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteItem(phaseIndex, i, bucket)}
                className="text-gray-600 hover:text-black"
                aria-label="항목 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {renderImportantButton(item)}
            </div>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => addItem(phaseIndex, bucket)}
        className="mt-2 inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs hover:bg-gray-100 max-[767px]:min-h-10 max-[767px]:px-3 max-[767px]:py-2 max-[767px]:text-sm"
      >
        <Plus className="h-3 w-3" /> 항목 추가
      </button>
    </>
  );

  const renderEvent = (phase, phaseIndex) =>
    renderPhaseWrapper(
      phase,
      <div className="relative pl-7 max-[767px]:pl-5">
      <div className="absolute -left-[12px] top-2 h-5 w-5 rounded-full border-4 border-black bg-yellow-400 max-[767px]:-left-[10px] max-[767px]:h-4 max-[767px]:w-4 max-[767px]:border-[3px]" />
      <div className="rounded-2xl border-2 border-yellow-500 bg-yellow-100 p-5 shadow-sm max-[767px]:p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="text-xs font-semibold text-yellow-700">{phase.title}</div>
          <div className="flex items-center gap-1">
            {renderMoveButtons(phase)}
            {phase.isCustom ? (
              <>
                <button
                  type="button"
                  onClick={() => updateCustomBox(phase.key)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-yellow-200/70 hover:text-black"
                  aria-label="박스 수정"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomEvent(phase.key)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-yellow-200/70 hover:text-black"
                  aria-label="박스 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
        <h2 className="mb-3 text-xl font-bold text-yellow-900 max-[767px]:text-lg">{phase.subtitle}</h2>
        <ul className="mb-4 space-y-1.5 text-sm leading-6 max-[767px]:space-y-2">
          {phase.items.map((item, i) => (
            <li
              key={item.id ?? i}
              className="max-[767px]:rounded-xl max-[767px]:border max-[767px]:border-yellow-300/80 max-[767px]:bg-white/70 max-[767px]:p-3"
            >
              <div className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <div className="min-w-0 flex flex-1 items-start gap-3 max-[767px]:block">
                <div className="flex-1 break-words pr-1">{item.text}</div>
                <div className="mt-2 hidden items-center justify-end gap-1 max-[767px]:flex">
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
                  {item.id ? renderImportantButton(item, "yellow") : null}
                </div>
              </div>
              <div className="flex items-center gap-1 max-[767px]:hidden">
                <button
                  type="button"
                  onClick={() => editItem(phaseIndex, i, item.text, "items")}
                  className="text-gray-600 hover:text-black"
                  aria-label="항목 수정"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(phaseIndex, i, "items")}
                  className="text-gray-600 hover:text-black"
                  aria-label="항목 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {item.id ? renderImportantButton(item, "yellow") : null}
              </div>
              </div>
            </li>
          ))}
        </ul>
        {!phase.isCustom ? (
          <button
            type="button"
            onClick={() => addItem(phaseIndex, "items")}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs hover:bg-yellow-200 max-[767px]:min-h-10 max-[767px]:px-3 max-[767px]:py-2 max-[767px]:text-sm"
          >
            <Plus className="h-3 w-3" /> 항목 추가
          </button>
        ) : null}
      </div>
    </div>
    );

  const renderPhase = (phase, phaseIndex) =>
    renderPhaseWrapper(
      phase,
      <div className="relative pl-7 max-[767px]:pl-5">
      <div className="absolute -left-[12px] top-2 h-5 w-5 rounded-full border-4 border-black bg-white max-[767px]:-left-[10px] max-[767px]:h-4 max-[767px]:w-4 max-[767px]:border-[3px]" />
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm max-[767px]:p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="text-xs font-semibold text-gray-500">{phase.title}</div>
          <div className="flex items-center gap-1">
            {renderMoveButtons(phase)}
            {phase.isCustom ? (
              <>
                <button
                  type="button"
                  onClick={() => updateCustomBox(phase.key)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                  aria-label="박스 수정"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomEvent(phase.key)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                  aria-label="박스 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
        <h2 className="mb-3 text-xl font-bold leading-tight max-[767px]:text-lg">{phase.subtitle}</h2>
        {renderPrioritySection(phase)}
        {renderChecklist(phase.items, phaseIndex, "items")}
        <div className="mt-4 border-t pt-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">기타 업무</div>
          {renderChecklist(phase.extraItems || [], phaseIndex, "extraItems")}
        </div>
      </div>
    </div>
    );

  const renderGanttRow = (row, index) => (
    <div
      key={row.label}
      className={`grid grid-cols-[180px_repeat(6,minmax(70px,1fr))] items-center text-sm max-[767px]:grid-cols-[140px_repeat(6,minmax(56px,1fr))] ${
        index < ganttRows.length - 1 ? "border-b border-gray-200" : ""
      }`}
    >
      <div className="py-3 font-medium max-[767px]:py-2 max-[767px]:pr-2 max-[767px]:text-xs">
        {row.label}
      </div>
      {ganttColumns.map((_, columnIndex) => (
        <div key={`${row.label}-${columnIndex}`} className="px-1 py-3 max-[767px]:py-2">
          {row.bars.includes(columnIndex) ? (
            <div className={`h-4 rounded-full ${row.color} max-[767px]:h-3`} />
          ) : null}
        </div>
      ))}
    </div>
  );

  const renderInfoSections = () => (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={addInfoCard}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-400 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" /> 정보 카드 추가
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
        {infoCards.map((card) => (
          <div
            key={card.id}
            className="rounded-[28px] border-2 border-black bg-gray-50 p-5 max-[767px]:rounded-2xl max-[767px]:p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold max-[767px]:text-base">{card.title}</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateInfoCard(card.id)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                  aria-label="카드 수정"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteInfoCard(card.id)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                  aria-label="카드 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-medium leading-5 tracking-tight text-gray-700 max-[767px]:grid-cols-1">
              {(card.lines || []).map((line) => (
                <div key={`${card.id}-${line}`}>• {line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGanttSection = () => (
    <div className="mt-8 rounded-[28px] border-2 border-black bg-white p-5 max-[767px]:overflow-x-auto max-[767px]:rounded-2xl max-[767px]:p-4">
      <h3 className="mb-5 text-xl font-bold max-[767px]:text-lg">간트형 일정 요약</h3>
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[180px_repeat(6,minmax(70px,1fr))] border-b border-gray-200 text-sm font-semibold text-gray-700 max-[767px]:grid-cols-[140px_repeat(6,minmax(56px,1fr))] max-[767px]:text-xs">
          <div className="py-3" />
          {ganttColumns.map((column) => (
            <div key={column} className="py-3 text-center max-[767px]:py-2">
              {column}
            </div>
          ))}
        </div>
        {ganttRows.map(renderGanttRow)}
      </div>
    </div>
  );

  const renderTrashTab = () => (
    <div className="mt-8 rounded-[28px] border-2 border-black bg-gray-50 p-5 max-[767px]:rounded-2xl max-[767px]:p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold max-[767px]:text-lg">휴지통</h3>
        <div className="text-sm text-gray-500">보관된 항목 {trashEntries.length}개</div>
      </div>
      {trashEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
          휴지통이 비어 있습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {trashEntries.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-1 text-xs font-semibold text-gray-500">
                {item.phase_title} / {item.phase_subtitle}
              </div>
              <div className="mb-3 text-sm font-medium leading-6">{item.text}</div>
              <div className="flex items-center justify-between gap-3 max-[767px]:flex-col max-[767px]:items-start">
                <div className="text-xs text-gray-400">
                  {item.bucket === "extraItems" ? "기타 업무" : "기본 항목"}에 있던 내용
                </div>
                <button
                  type="button"
                  onClick={() => restoreItem(item.id)}
                  className="rounded-lg border border-black px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  원래 위치로 복구
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur max-[767px]:px-4">
        <div className="mx-auto flex max-w-5xl justify-center">
          <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-white p-5 pt-6 font-sans max-[767px]:px-4 max-[767px]:pb-8 max-[767px]:pt-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-2 text-3xl font-bold leading-tight max-[767px]:text-2xl">
            더 골든비 신규 쇼핑몰 구축 타임라인
          </h1>
          <p className="mb-6 text-base text-gray-600 max-[767px]:mb-5 max-[767px]:text-sm">
            목표 오픈: 6월 15일 / 안정 오픈: 6월 말
          </p>

          {activeTab === "timeline" ? (
            <>
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => addCustomBox("phase")}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-400 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" /> 일반 박스 추가
                </button>
                <button
                  type="button"
                  onClick={() => addCustomBox("event")}
                  className="inline-flex items-center gap-2 rounded-lg border border-yellow-500 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 hover:bg-yellow-100"
                >
                  <Plus className="h-4 w-4" /> 노란 일정 박스 추가
                </button>
              </div>
              <div className="relative ml-3 space-y-6 border-l-4 border-black max-[767px]:ml-2 max-[767px]:space-y-4">
                {orderedPhases.map((phase) =>
                  phase.type === "event"
                    ? renderEvent(phase, phase.baseIndex)
                    : renderPhase(phase, phase.baseIndex)
                )}
              </div>
            </>
          ) : null}

          {activeTab === "gantt" ? (
            <>
              {renderGanttSection()}
              {renderInfoSections()}
              <div className="mt-6 rounded-[28px] border-2 border-black bg-gray-50 p-5 max-[767px]:rounded-2xl max-[767px]:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold max-[767px]:text-lg">메모장</h3>
                  <div className="text-xs text-gray-500">작성 내용은 이 브라우저에 저장됩니다</div>
                </div>
                <textarea
                  value={memoText}
                  onChange={(event) => setMemoText(event.target.value)}
                  placeholder="필요한 일정 메모나 체크 포인트를 자유롭게 적어주세요."
                  className="min-h-[220px] w-full rounded-2xl border-2 border-black bg-white p-4 text-sm leading-6 outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          ) : null}

          {activeTab === "trash" ? renderTrashTab() : null}
        </div>
      </div>
    </>
  );
}
