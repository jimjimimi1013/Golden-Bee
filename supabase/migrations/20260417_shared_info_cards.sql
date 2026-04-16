create table if not exists public.timeline_info_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lines text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.timeline_info_cards (title, lines, sort_order)
select seed.title, seed.lines, seed.sort_order
from (
  values
    (
      '사이트 제작 참고 정보',
      array[
        '모든 개발 및 디자인 작업은 6월을 데드라인으로 ASAP 진행',
        '더 골든비는 현재 금이 들어간 소형 장식을 붙인 액자만 판매 (초기 기준)',
        '제품 포장 방식: 한지 포장 + 금박 더 골든비 스티커 부착 예정',
        '액자 사이즈는 고정 -> 사이즈 변경 시, 다른 규격의 제품을 선택하는 구조',
        '서브타이틀은 변경 가능한 폰트는 2~3종으로 제한 (디자인 통일성 유지 목적)',
        '사이트 오픈과 동시에 SNS 광고 진행 예정 (인스타그램, 틱톡 중심)',
        '액자 카테고리 확장 순서 -> 효도 / 부모님 / 사랑 -> 골프 -> 기업용',
        '인사이트 제품 상세페이지의 뷰 형태는 더보기 형태 또는 새창 구조로 진행 검토'
      ]::text[],
      1
    ),
    (
      '사장님/대표님 확인',
      array[
        '4월: 개발사 최종 선정 / 계약 조건 확정',
        '5월 초: 상세/영상 기획 컨펌',
        '6월 초: 오픈'
      ]::text[],
      2
    ),
    (
      '주요 리스크',
      array[
        '개발사 선정 지연 시 전체 일정 지연',
        'PDF 오류 발생 시 QA 연장 가능',
        '촬영 지연 시 상세페이지 일정 영향'
      ]::text[],
      3
    ),
    (
      '핵심 포인트',
      array[
        '가장 중요한 일정은 4월 내 개발사 선정 완료입니다.',
        '6월 15일 오픈은 공격적 일정입니다.',
        'QA 지연 시 6월 말까지 버퍼를 확보해야 안전합니다.'
      ]::text[],
      4
    )
) as seed(title, lines, sort_order)
where not exists (select 1 from public.timeline_info_cards);
