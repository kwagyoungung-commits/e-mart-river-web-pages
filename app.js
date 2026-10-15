/* ============================================================
   app.js — 이마트 리버점 삼겹살 주말 프로모션 (Vanilla JS)
   PRD v1.1 기반 | No Dependencies | ES6+
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   1. 전역 상태 (Single Source of Truth)
   ────────────────────────────────────────── */
const state = {
  targetPrice:    35000,
  discountAmount: 2000,
  targetDate:     new Date('2026-11-07T10:00:00+09:00'),

  baseItem: { id: 'FR-201', name: '국내산 삼겹살 500g (FR-201)', price: 13900, qty: 1 },

  pairings: [
    { id: 'VEG-01',  name: '친환경 모둠 쌈채소 (상추·깻잎)', price: 2980,  icon: '🥬', added: false },
    { id: 'GAR-02',  name: '깐마늘 200g',                     price: 2480,  icon: '🧄', added: false },
    { id: 'SSAM-03', name: '정통 고기전용 쌈장 500g',          price: 3280,  icon: '🥣', added: false },
    { id: 'PEP-04',  name: '청양·오이맛 고추 팩',              price: 1980,  icon: '🌶️', added: false },
    { id: 'ONI-05',  name: '신선 햇 양파 1망',                 price: 3980,  icon: '🧅', added: false },
    { id: 'MUSH-06', name: '새송이 버섯 1팩',                  price: 2480,  icon: '🍄', added: false },
    { id: 'KIM-07',  name: '맛있는 배추김치 1kg',              price: 8900,  icon: '🥢', added: false },
    { id: 'BEV-08',  name: '씨그램 플레인 탄산수 6입',         price: 3980,  icon: '🥤', added: false }
  ],

  sliderIndex: 0,
  lightboxOpen: false
};

/* ──────────────────────────────────────────
   2. 유틸리티
   ────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);
const fmt = (n) => n.toLocaleString('ko-KR');

function showToast(msg) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ──────────────────────────────────────────
   3. D-Day 카운트다운 타이머
   ────────────────────────────────────────── */
function initCountdown() {
  const cdDays  = $('#cd-days');
  const cdHours = $('#cd-hours');
  const cdMins  = $('#cd-mins');
  const cdSecs  = $('#cd-secs');
  const cdWrap  = $('#countdown-wrap');

  if (!cdDays) return;

  function tick() {
    const now  = new Date();
    const diff = state.targetDate - now;

    if (diff <= 0) {
      clearInterval(timer);
      if (cdWrap) {
        cdWrap.innerHTML = '<span class="cd-live">🔥 지금 리버점 할인 행사 진행 중!</span>';
        cdWrap.style.cssText = 'background:linear-gradient(135deg,#2A9D8F,#228B7E);padding:6px 16px;border-radius:var(--radius-sm);color:#fff;font-weight:700;font-size:0.82rem;';
      }
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);

    cdDays.textContent  = String(d).padStart(2, '0');
    cdHours.textContent = String(h).padStart(2, '0');
    cdMins.textContent  = String(m).padStart(2, '0');
    cdSecs.textContent  = String(s).padStart(2, '0');
  }

  tick();
  const timer = setInterval(tick, 1000);
}

/* ──────────────────────────────────────────
   4. 장바구니 & 35,000원 계산기
   ────────────────────────────────────────── */
function calcTotals() {
  const base  = state.baseItem.price;
  const extra = state.pairings.filter(p => p.added).reduce((s, p) => s + p.price, 0);
  const total = base + extra;
  const qualified   = total >= state.targetPrice;
  const discount    = qualified ? state.discountAmount : 0;
  const finalPrice  = total - discount;
  const remain      = Math.max(0, state.targetPrice - total);
  const percent     = Math.min(100, (total / state.targetPrice) * 100);
  return { total, qualified, discount, finalPrice, remain, percent };
}

function renderPairings() {
  const list = $('#pairing-list');
  if (!list) return;

  // 이벤트 위임 — 한 번만 등록
  if (!list._delegated) {
    list.addEventListener('click', e => {
      const btn = e.target.closest('.pi-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      togglePairing(id);
    });
    list._delegated = true;
  }

  list.innerHTML = '';
  state.pairings.forEach(p => {
    const li = document.createElement('li');
    li.className = `pairing-item${p.added ? ' added' : ''}`;
    li.innerHTML = `
      <span class="pi-icon">${p.icon}</span>
      <span class="pi-name">${p.name}</span>
      <span class="pi-price">+${fmt(p.price)}원</span>
      <button class="pi-btn${p.added ? ' added-state' : ''}" data-id="${p.id}">
        ${p.added ? '빼기' : '담기'}
      </button>
    `;
    list.appendChild(li);
  });
}

function updateCartUI() {
  const { total, qualified, discount, finalPrice, remain, percent } = calcTotals();

  // 프로그레스 바
  const bar = $('#progress-bar');
  if (bar) bar.style.width = percent + '%';

  const amtEl = $('#progress-amount');
  if (amtEl) amtEl.textContent = fmt(total) + '원';

  const curEl = $('#progress-current-text');
  if (curEl) curEl.textContent = fmt(total) + '원';

  // 상태 메시지
  const statusEl = $('#status-msg');
  const textEl   = $('#status-text');
  if (statusEl && textEl) {
    if (qualified) {
      statusEl.classList.add('qualified');
      textEl.innerHTML = `🎉 35,000원 달성! <strong>2,000원 할인</strong> 적용됩니다!`;
    } else {
      statusEl.classList.remove('qualified');
      textEl.innerHTML = `🛒 <strong id="remain-amount">${fmt(remain)}원</strong> 더 담으면 2,000원 즉시 할인!`;
    }
  }

  // 요약
  const rawEl      = $('#total-raw');
  const discEl     = $('#discount-amount');
  const finalEl    = $('#final-price');
  if (rawEl)   rawEl.textContent   = fmt(total) + '원';
  if (discEl)  discEl.textContent  = `-${fmt(discount)}원`;
  if (finalEl) finalEl.textContent = fmt(finalPrice) + '원';

  // 계산기 카드 달성 애니메이션
  const card = $('.calculator-card');
  if (card) {
    if (qualified) {
      card.classList.add('qualified');
    } else {
      card.classList.remove('qualified');
    }
  }

  // 플로팅 바 동기화
  syncFloatingBar(total, remain, qualified);
}

function togglePairing(id) {
  const item = state.pairings.find(p => p.id === id);
  if (!item) return;
  item.added = !item.added;
  renderPairings();
  updateCartUI();
  if (item.added) {
    showToast(`✅ ${item.name} 담았어요!`);
  }
}

function copyCartToClipboard() {
  const { total, qualified, discount, finalPrice } = calcTotals();
  const addedItems = state.pairings.filter(p => p.added);
  const lines = [
    '🛒 이마트 리버점 삼겹살 프로모션 장보기 목록',
    '─────────────────────────',
    `✅ 국내산 삼겹살 500g (FR-201)  13,900원`,
    ...addedItems.map(p => `  + ${p.name}  ${fmt(p.price)}원`),
    '─────────────────────────',
    `상품 합계:  ${fmt(total)}원`,
    qualified
      ? `💰 2,000원 할인 적용!\n최종 결제 금액:  ${fmt(finalPrice)}원`
      : `⚠ 35,000원까지 ${fmt(state.targetPrice - total)}원 더 필요`,
    '',
    '#이마트리버점 #삼겹살프로모션 #주말할인'
  ];

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => showToast('📋 장보기 목록이 클립보드에 복사됐어요!'))
    .catch(() => showToast('⚠ 복사에 실패했어요. 다시 시도해주세요.'));
}

/* ──────────────────────────────────────────
   5. 캐러셀 슬라이더 (Touch API 포함)
   ────────────────────────────────────────── */
function initCarousel() {
  const track    = $('#carousel-track');
  const prevBtn  = $('#prev-btn');
  const nextBtn  = $('#next-btn');
  const dotsWrap = $('#carousel-dots');

  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  const total  = slides.length;

  // 도트 생성
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `${i + 1}번 슬라이드`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function updateDots() {
    $$('.dot', dotsWrap).forEach((d, i) => {
      d.classList.toggle('active', i === state.sliderIndex);
    });
  }

  function goTo(idx) {
    state.sliderIndex = (idx + total) % total;
    track.style.transform = `translateX(-${state.sliderIndex * 100}%)`;
    updateDots();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(state.sliderIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(state.sliderIndex + 1));

  // 자동 재생 (5초)
  let autoPlay = setInterval(() => goTo(state.sliderIndex + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoPlay));
  track.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => goTo(state.sliderIndex + 1), 5000);
  });

  // 터치 스와이프
  let startX = 0;
  let moved  = false;

  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    moved  = false;
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    if (moved) return;
    const diff = e.touches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? state.sliderIndex - 1 : state.sliderIndex + 1);
      moved = true;
    }
  }, { passive: true });

  track.addEventListener('touchend', () => { moved = false; });

  // 라이트박스 연결 (슬라이드 클릭)
  slides.forEach(slide => {
    slide.addEventListener('click', () => {
      const src = slide.dataset.src;
      const alt = slide.dataset.alt || '';
      openLightbox(src, alt);
    });
  });

  // 히어로 포스터 클릭도 라이트박스
  const heroPoster = $('#hero-poster');
  if (heroPoster) {
    heroPoster.style.cursor = 'zoom-in';
    heroPoster.addEventListener('click', () => {
      openLightbox(heroPoster.src, heroPoster.alt);
    });
  }
}

/* ──────────────────────────────────────────
   6. 라이트박스 모달
   ────────────────────────────────────────── */
function openLightbox(src, alt) {
  const modal   = $('#lightbox');
  const img     = $('#lightbox-img');
  const altEl   = $('#lightbox-alt');
  if (!modal || !img) return;
  img.src       = src;
  img.alt       = alt;
  if (altEl) altEl.textContent = alt;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  state.lightboxOpen = true;
}

function closeLightbox() {
  const modal = $('#lightbox');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  state.lightboxOpen = false;
}

function initLightbox() {
  const closeBtn  = $('#lightbox-close');
  const backdrop  = $('#lightbox-backdrop');
  if (closeBtn)  closeBtn.addEventListener('click', closeLightbox);
  if (backdrop)  backdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.lightboxOpen) closeLightbox();
  });
}

/* ──────────────────────────────────────────
   7. FAQ 아코디언 (이벤트 위임)
   ────────────────────────────────────────── */
function initFAQ() {
  const container = $('#faq-list');
  if (!container) return;

  container.addEventListener('click', e => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;

    const answer  = btn.nextElementSibling;
    const isOpen  = answer.classList.contains('open');

    // 모두 닫기
    $$('.faq-answer', container).forEach(a => {
      a.classList.remove('open');
      a.style.maxHeight = null;
    });
    $$('.faq-question', container).forEach(b => b.classList.remove('open-q'));

    // 현재 토글
    if (!isOpen) {
      answer.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      btn.classList.add('open-q');
    }
  });
}

/* ──────────────────────────────────────────
   8. 스크롤 & 플로팅 바 (IntersectionObserver)
   ────────────────────────────────────────── */
function syncFloatingBar(total, remain, qualified) {
  const amountEl = $('#floating-amount');
  const remainEl = $('#floating-remain');
  if (amountEl) amountEl.textContent = fmt(total) + '원';
  if (remainEl) {
    if (qualified) {
      remainEl.textContent = '(🎉 할인 달성!)';
      remainEl.classList.add('achieved');
    } else {
      remainEl.textContent = `(-${fmt(remain)}원)`;
      remainEl.classList.remove('achieved');
    }
  }
}

function initScrollEffects() {
  const hero      = $('#hero');
  const floatBar  = $('#floating-bar');
  const header    = $('#header');

  // 플로팅 바 – 히어로 벗어나면 노출
  if (hero && floatBar) {
    const heroObs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          floatBar.classList.toggle('show', !e.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    heroObs.observe(hero);
  }

  // 헤더 스크롤 그림자
  if (header) {
    const headerObs = new IntersectionObserver(
      ([e]) => header.classList.toggle('scrolled', !e.isIntersecting),
      { threshold: 0, rootMargin: '-70px 0px 0px 0px' }
    );
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    headerObs.observe(sentinel);
  }

  // 섹션 등장 애니메이션
  const revealEls = $$('.reveal-section');
  if (revealEls.length) {
    const revealObs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            revealObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach(el => revealObs.observe(el));
  }

  // GNB 활성 링크 (스크롤 위치 기반)
  const sections = $$('section[id]');
  const gnbLinks = $$('.gnb-link');
  if (sections.length && gnbLinks.length) {
    const gnbObs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            gnbLinks.forEach(a => {
              a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach(s => gnbObs.observe(s));
  }
}

/* ──────────────────────────────────────────
   9. 햄버거 메뉴
   ────────────────────────────────────────── */
function initHamburger() {
  const btn = $('#hamburger');
  const gnb = $('#gnb');
  if (!btn || !gnb) return;

  btn.addEventListener('click', () => {
    gnb.classList.toggle('open');
  });

  // GNB 링크 클릭 시 닫기
  $$('.gnb-link', gnb).forEach(a => {
    a.addEventListener('click', () => gnb.classList.remove('open'));
  });
}

/* ──────────────────────────────────────────
   10. 11월 캘린더 생성
   ────────────────────────────────────────── */
function initCalendar() {
  const grid = $('#calendar-grid');
  if (!grid) return;

  const days     = ['일', '월', '화', '수', '목', '금', '토'];
  const eventDays = new Set([7, 8, 14, 15]);

  // 요일 헤더
  days.forEach((d, i) => {
    const el = document.createElement('div');
    el.className = 'cal-header';
    el.textContent = d;
    if (i === 0) el.style.color = '#E63946';
    if (i === 6) el.style.color = '#3B82F6';
    grid.appendChild(el);
  });

  // 2026년 11월 1일은 무슨 요일? → 일요일(0)
  const firstDow = new Date(2026, 10, 1).getDay(); // 0 = 일
  for (let i = 0; i < firstDow; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= 30; d++) {
    const dow = (firstDow + d - 1) % 7;
    const el  = document.createElement('div');
    let cls   = 'cal-day';
    if (dow === 0) cls += ' sun';
    if (dow === 6) cls += ' sat';
    if (eventDays.has(d)) cls += ' event';
    el.className   = cls;
    el.textContent = d;
    grid.appendChild(el);
  }
}

/* ──────────────────────────────────────────
   11. 초기화
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // 카운트다운
  initCountdown();

  // 계산기 렌더
  renderPairings();
  updateCartUI();

  // 복사 버튼
  const copyBtn = $('#copy-btn');
  if (copyBtn) copyBtn.addEventListener('click', copyCartToClipboard);

  // 캐러셀 & 라이트박스
  initCarousel();
  initLightbox();

  // FAQ
  initFAQ();

  // 스크롤 효과 & 플로팅 바
  initScrollEffects();

  // 햄버거
  initHamburger();

  // 캘린더
  initCalendar();
});
