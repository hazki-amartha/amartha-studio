'use client'

// ---------------------------------------------------------------------------
// Agen Juara (tier) card — a BESPOKE ASSET, ported 1:1 from the original HTML
// prototype (Figma 2039:3678). This is the missing-component escape hatch
// (CLAUDE.md §4): the 3D gold trophy, its glow/base/shadow, the gradient title
// and the coin mark are multi-colour artwork with fixed palettes that do not
// map onto FunDS tokens — so the raw hex/gradients and pixel offsets are
// deliberate here, and confined to this one file. Everything else in the
// project stays strictly on-system.
// ---------------------------------------------------------------------------

import { Card } from '@/design-system/components'
import { ChevronRight } from '@/design-system/icons'

export function AgenJuaraCard() {
  return (
    // Real <Card> so Inspect snaps to a FunDS boundary; flush + inline
    // border/background/radius keep the bespoke gold look.
    <Card
      flush
      className="relative flex flex-col items-start"
      style={{
        borderRadius: 8,
        border: '1px solid #FFF0E3',
        background:
          'linear-gradient(109.719deg,#FFFFFF 0%,#FFFFFF 30.217%,#FFF6D9 80.512%,#FFFDFA 100%)',
      }}
    >
      {/* glow */}
      <span
        aria-hidden
        style={{ position: 'absolute', left: 223, top: -158, width: 245, height: 245, pointerEvents: 'none' }}
      >
        <svg width="245" height="245" viewBox="0 0 261 261" fill="none">
          <g filter="url(#jglow)">
            <circle cx="130.5" cy="130.5" r="122.5" fill="url(#jglowg)" />
          </g>
          <defs>
            <filter id="jglow" x="0" y="0" width="261" height="261" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4" result="b" />
            </filter>
            <linearGradient id="jglowg" x1="110.5" y1="164.5" x2="73.5" y2="250" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFE59B" />
              <stop offset="1" stopColor="#FFEDB9" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      {/* head — gradient title + spark */}
      <div className="relative flex w-full items-center" style={{ gap: 8, padding: '8px 8px 0' }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.5,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(to top,#C87C1A 0%,#EDAC2A 52.404%,#FFAE00 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Agen Juara
        </span>
        <span aria-hidden style={{ position: 'absolute', left: 95, top: 6, width: 10, height: 12, display: 'flex' }}>
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path
              d="M5.0013 12C4.90786 11.439 4.48222 8.55672 3.47781 7.71263C2.3618 6.7759 0 6.0965 0 6.0965C0 6.0965 2.93278 5.58439 3.77628 4.05319C4.48482 2.76903 4.90267 1.42312 4.95199 0.211023L4.95977 0C5.0584 0.602187 5.5619 3.32747 6.44173 4.28222C7.50324 5.4377 10 6.13511 10 6.13511C10 6.13511 7.32676 6.47223 6.33013 7.74351C5.5619 8.71885 5.09733 10.4611 5.04801 11.6732L5.0013 12Z"
              fill="#F8C723"
            />
          </svg>
        </span>
      </div>

      {/* body — points + progress */}
      <div className="relative flex w-full flex-col" style={{ gap: 2, padding: '0 84px 8px 8px' }}>
        <div className="flex w-full flex-col" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <span aria-hidden style={{ flex: '0 0 auto', width: 20, height: 20, display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#C6CAD0" />
                <circle cx="10" cy="10" r="8.5714" fill="#8E95A3" />
                <g transform="translate(4.286 4.286) scale(1.1667)">
                  <path
                    d="M1.90768 0.277211C3.03533 -0.0851676 4.17965 -0.100357 5.30026 0.280141C6.19437 0.582619 6.64869 1.26777 6.7778 2.18053C6.86418 2.791 6.80246 3.40409 6.82077 4.01549C6.85166 4.4966 6.82702 4.97711 6.81198 5.45788C5.96083 5.24921 5.08346 5.87973 5.08346 6.80065V8.29186C4.50205 8.4995 3.87537 8.52364 3.24362 8.50084C2.5925 8.47762 1.95364 8.38367 1.33444 8.12584C-0.250463 7.46566 -0.294623 5.4197 0.529751 4.54674C0.904363 4.15003 1.34558 3.87678 1.85397 3.70397C2.65487 3.43265 3.48351 3.3542 4.3276 3.37975C4.84396 3.39552 4.84363 3.3815 4.79342 2.87487C4.78591 2.80657 4.78268 2.73706 4.78268 2.66784C4.78871 1.9265 4.36467 1.56848 3.63522 1.48717C2.89817 1.40448 2.17657 1.52066 1.46627 1.71764C1.28238 1.76866 1.09106 1.79409 0.906704 1.84655C0.687965 1.90879 0.652282 1.82806 0.687954 1.62877C0.813275 0.925993 1.2469 0.490039 1.90768 0.277211ZM4.58542 4.53893C4.1737 4.52917 3.76447 4.54447 3.35885 4.59557C2.26047 4.7341 1.74505 5.53865 2.10885 6.53698C2.22434 6.85567 2.44503 7.06723 2.76706 7.19127C3.08488 7.31392 3.41171 7.32719 3.74362 7.31139C4.2215 7.28954 4.56759 7.03085 4.70749 6.57604C4.83048 6.17603 4.83664 5.76096 4.83053 5.34655C4.83052 5.16685 4.82126 4.98425 4.83346 4.80455V4.8026C4.8466 4.61633 4.78298 4.5436 4.58542 4.53893Z"
                    fill="#fff"
                  />
                  <path
                    d="M5.71749 9.15806V6.7603C5.71749 6.28674 6.18794 5.97873 6.58778 6.19051L8.85125 7.3894C9.29448 7.62416 9.29448 8.2942 8.85125 8.52896L6.58778 9.72784C6.18794 9.93963 5.71749 9.63162 5.71749 9.15806Z"
                    fill="#fff"
                  />
                </g>
              </svg>
            </span>
            <b className="text-16 font-bold text-default">1.240</b>
          </div>
          <div className="w-full overflow-hidden" style={{ height: 4, background: '#E5E7EB', borderRadius: 2010 }}>
            <div style={{ height: '100%', width: '57%', background: '#A642B7', borderRadius: 2010 }} />
          </div>
        </div>
        <p className="text-12" style={{ margin: 0, color: '#8E95A3' }}>
          260 poin lagi bisa jadi Agen Panutan
        </p>
      </div>

      {/* link */}
      <button
        type="button"
        className="relative flex w-full items-center justify-between border-t border-default p-8 text-left text-12 text-primary-500"
        style={{ gap: 8 }}
      >
        <span>Lihat Benefit</span>
        <ChevronRight size={20} className="shrink-0" />
      </button>

      {/* base reflection */}
      <span aria-hidden style={{ position: 'absolute', right: 18, top: 28, width: 48, height: 57, pointerEvents: 'none' }}>
        <svg width="48" height="57" viewBox="0 0 48 57" fill="none">
          <mask id="jbm" fill="#fff">
            <path d="M48 52C48 54.7614 37.2548 57 24 57C10.7452 57 0 54.7614 0 52V0H48V52Z" />
          </mask>
          <path d="M48 52C48 54.7614 37.2548 57 24 57C10.7452 57 0 54.7614 0 52V0H48V52Z" fill="url(#jbg0)" />
          <path
            d="M0 0V-0.4H-0.4V0H0ZM48 0H48.4V-0.4H48V0ZM48 52H47.6C47.6 52.2057 47.5017 52.4477 47.227 52.7274C46.951 53.0084 46.5233 53.2987 45.9372 53.5874C44.7666 54.164 43.0468 54.6944 40.889 55.1439C36.5799 56.0417 30.6085 56.6 24 56.6V57V57.4C30.6463 57.4 36.6749 56.839 41.0521 55.9271C43.2375 55.4719 45.0324 54.9248 46.2907 54.3051C46.9191 53.9955 47.4344 53.6579 47.7978 53.288C48.1625 52.9167 48.4 52.4846 48.4 52H48ZM24 57V56.6C17.3915 56.6 11.4201 56.0417 7.11102 55.1439C4.95318 54.6944 3.2334 54.164 2.06278 53.5874C1.47669 53.2987 1.04898 53.0084 0.772963 52.7274C0.498251 52.4477 0.4 52.2057 0.4 52H0H-0.4C-0.4 52.4846 -0.162465 52.9167 0.202227 53.288C0.565612 53.6579 1.08092 53.9955 1.70929 54.3051C2.96761 54.9248 4.76255 55.4719 6.94786 55.9271C11.325 56.839 17.3537 57.4 24 57.4V57ZM0 52H0.4V0H0H-0.4V52H0ZM0 0V0.4H48V0V-0.4H0V0ZM48 0H47.6V52H48H48.4V0H48Z"
            fill="url(#jbg1)"
            mask="url(#jbm)"
          />
          <defs>
            <linearGradient id="jbg0" x1="24" y1="17" x2="24" y2="51.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EBEBEB" stopOpacity="0.3" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="jbg1" x1="24" y1="13.5" x2="24" y2="54.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      {/* base shadow ring */}
      <span aria-hidden style={{ position: 'absolute', right: 18, top: 75, width: 48, height: 10, pointerEvents: 'none' }}>
        <svg width="48" height="10" viewBox="0 0 48 10" fill="none">
          <path
            d="M24 0.200195C30.6179 0.200195 36.6036 0.758893 40.9297 1.66016C43.0943 2.11113 44.8329 2.64602 46.0254 3.2334C46.6221 3.52729 47.0723 3.82956 47.3701 4.13281C47.6671 4.43526 47.7998 4.72467 47.7998 5C47.7998 5.27533 47.6671 5.56474 47.3701 5.86719C47.0723 6.17044 46.6221 6.47271 46.0254 6.7666C44.8329 7.35398 43.0943 7.88887 40.9297 8.33984C36.6036 9.24111 30.6179 9.7998 24 9.7998C17.3821 9.7998 11.3964 9.24111 7.07031 8.33984C4.90565 7.88887 3.16715 7.35398 1.97461 6.7666C1.37795 6.47271 0.927742 6.17044 0.629883 5.86719C0.332932 5.56474 0.200195 5.27533 0.200195 5C0.200195 4.72467 0.332932 4.43526 0.629883 4.13281C0.927742 3.82956 1.37795 3.52729 1.97461 3.2334C3.16715 2.64602 4.90565 2.11113 7.07031 1.66016C11.3964 0.758893 17.3821 0.200195 24 0.200195Z"
            stroke="url(#jring)"
            strokeWidth="0.4"
          />
          <defs>
            <linearGradient id="jring" x1="24" y1="10" x2="24" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      {/* trophy */}
      <span aria-hidden style={{ position: 'absolute', right: 12, top: 11, width: 60, height: 66, pointerEvents: 'none' }}>
        <svg width="60" height="66" viewBox="0 0 60 66" fill="none" style={{ overflow: 'visible' }}>
          <svg x="-8" y="-4" width="76" height="82.0038" viewBox="0 0 76 82.0038" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <g filter="url(#jf1)">
              <path
                d="M68 50.2889V23.7174C68 21.4211 66.7511 19.2998 64.724 18.1504L41.2747 4.86208C39.2476 3.71264 36.7498 3.71264 34.7253 4.86208L11.276 18.1504C9.24887 19.2998 8 21.4211 8 23.7174V50.2889C8 52.5853 9.24887 54.7065 11.276 55.856L34.7253 69.1417C36.7524 70.2912 39.2502 70.2912 41.2747 69.1417L64.724 55.856C66.7511 54.7065 68 52.5853 68 50.2889Z"
                fill="url(#jg1)"
              />
            </g>
            <defs>
              <filter id="jf1" x="0" y="0" width="76" height="82.0038" filterUnits="userSpaceOnUse">
                <feFlood floodOpacity="0" result="bg" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha" />
                <feOffset dy="4" />
                <feGaussianBlur stdDeviation="4" />
                <feComposite in2="ha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.714787 0 0 0 0 0.289013 0 0 0 0 0.076126 0 0 0 0.2 0" />
                <feBlend mode="normal" in2="bg" result="e1" />
                <feBlend mode="normal" in="SourceGraphic" in2="e1" />
              </filter>
              <linearGradient id="jg1" x1="58.2702" y1="76.5002" x2="22.4045" y2="3.92582" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A65C1E" />
                <stop offset="1" stopColor="#FEDB40" />
              </linearGradient>
            </defs>
          </svg>
          <svg x="6.168" y="2.554" width="39.4855" height="55.9799" viewBox="0 0 39.4855 55.9799" preserveAspectRatio="none">
            <path
              opacity="0.24"
              d="M9.55398 54.7721C12.1319 50.0703 14.7641 45.3964 17.4531 40.753C20.137 36.1172 22.8752 31.5144 25.6703 26.942C28.4732 22.3595 31.3303 17.8074 34.2469 13.2934C35.9716 10.6215 37.7195 7.96486 39.4855 5.3209L30.0944 0C27.8681 3.40517 25.6703 6.83065 23.5061 10.2764C20.393 15.2345 17.3497 20.2306 14.3736 25.2698C11.4131 30.2837 8.51972 35.3357 5.69619 40.4257C3.76212 43.912 1.86684 47.4162 0 50.9381L8.89722 55.9799C9.117 55.5764 9.3342 55.173 9.55398 54.7721Z"
              fill="#F5D6D1"
            />
          </svg>
          <svg x="19.026" y="10.039" width="34.0142" height="53.1837" viewBox="0 0 34.0142 53.1837" preserveAspectRatio="none">
            <path
              opacity="0.24"
              d="M11.8216 39.0834C14.4383 34.2497 17.0989 29.4362 19.8449 24.6736C22.5856 19.916 25.4118 15.2066 28.362 10.5708C30.1952 7.69082 32.0776 4.8388 34.0142 2.02484L30.4409 0C28.1913 3.40771 25.9858 6.84334 23.819 10.2993C20.9438 14.8843 18.1306 19.51 15.3639 24.161C12.6076 28.7943 9.89528 33.4504 7.20621 38.1217C4.78862 42.3211 2.39431 46.5306 0 50.7452L4.30252 53.1837C6.7925 48.4768 9.28765 43.7725 11.8242 39.0885L11.8216 39.0834Z"
              fill="#F5D6D1"
            />
          </svg>
          <svg x="4.632" y="4.963" width="50.733" height="56.0725" viewBox="0 0 50.733 56.0725" preserveAspectRatio="none">
            <path
              d="M50.733 39.7615V16.311C50.733 14.6744 49.8436 13.1595 48.3982 12.34L27.7027 0.614682C26.2573 -0.204894 24.4758 -0.204894 23.0304 0.614682L2.33484 12.34C0.889464 13.1595 0 14.6718 0 16.311V39.7615C0 41.3981 0.889464 42.913 2.33484 43.7325L23.0304 55.4578C24.4758 56.2774 26.2573 56.2774 27.7027 55.4578L48.3982 43.7325C49.8436 42.913 50.733 41.4007 50.733 39.7615Z"
              fill="url(#jg3)"
            />
            <defs>
              <linearGradient id="jg3" x1="41.1532" y1="53.2071" x2="17.0564" y2="13.3099" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF970F" />
                <stop offset="0.99" stopColor="#FFEDB9" />
              </linearGradient>
            </defs>
          </svg>
          <svg x="4.632" y="5.148" width="34.4279" height="45.6559" viewBox="0 0 34.4279 45.6559" preserveAspectRatio="none" style={{ mixBlendMode: 'multiply' }}>
            <path
              d="M3.66904 42.1974C3.17259 41.2307 2.78992 40.203 2.57531 39.1399C2.31674 37.861 2.35811 36.5695 2.3607 35.2703C2.36587 32.1367 2.40207 28.9979 2.63478 25.8693C2.75113 24.2961 2.92178 22.7255 3.15708 21.1625C3.351 19.8785 3.51907 18.554 4.05171 17.3564C4.91791 15.4051 6.60116 13.9436 8.34389 12.7485C10.1823 11.4899 12.181 10.4826 14.0737 9.31031C16.2017 7.99087 18.3943 6.72725 20.693 5.71483C22.7434 4.81152 24.8843 4.16449 27.1183 3.90821C29.5566 3.6291 32.0155 3.82702 34.4279 4.23807L28.3155 0.774538C26.4926 -0.258179 24.2456 -0.258179 22.4228 0.774538L2.94506 11.8122C1.12217 12.8449 0 14.753 0 16.8184V38.8861C0 40.9515 1.12217 42.8597 2.94506 43.8924L6.05818 45.6559C5.12993 44.5927 4.31286 43.4509 3.66904 42.1949V42.1974Z"
              fill="url(#jg4)"
            />
            <defs>
              <linearGradient id="jg4" x1="37.7143" y1="55.0747" x2="13.6377" y2="15.2057" gradientUnits="userSpaceOnUse">
                <stop stopColor="#CF9C37" />
                <stop offset="0.99" stopColor="#FFF7CB" />
              </linearGradient>
            </defs>
          </svg>
          <svg x="6" y="5.003" width="9.96251" height="11.8318" viewBox="0 0 9.96251 11.8318" preserveAspectRatio="none">
            <path
              d="M4.98255 11.8318C4.88946 11.2787 4.46542 8.43681 3.46477 7.60455C2.35294 6.68094 0 6.01107 0 6.01107C0 6.01107 2.92178 5.50613 3.76212 3.99639C4.468 2.73023 4.88429 1.40318 4.93342 0.208066L4.94118 0C5.03943 0.593749 5.54105 3.28084 6.41758 4.22221C7.47511 5.3615 9.96251 6.04913 9.96251 6.04913C9.96251 6.04913 7.29929 6.38153 6.3064 7.635C5.54105 8.59667 5.07822 10.3145 5.02909 11.5096L4.98255 11.8318Z"
              fill="#fff"
            />
          </svg>
          <svg x="13.002" y="5.003" width="4" height="4" viewBox="0 0 4 4" preserveAspectRatio="none">
            <path
              d="M2.00052 4C1.96315 3.813 1.79289 2.85224 1.39112 2.57088C0.944719 2.25863 0 2.03217 0 2.03217C0 2.03217 1.17311 1.86146 1.51051 1.35106C1.79393 0.923011 1.96107 0.474373 1.98079 0.070341L1.98391 0C2.02336 0.200729 2.22476 1.10916 2.57669 1.42741C3.0013 1.81257 4 2.04504 4 2.04504C4 2.04504 2.9307 2.15741 2.53205 2.58117C2.22476 2.90628 2.03893 3.48703 2.01921 3.89106L2.00052 4Z"
              fill="#fff"
            />
          </svg>
          <svg x="46.002" y="46.002" width="10" height="12" viewBox="0 0 10 12" preserveAspectRatio="none">
            <path
              d="M5.0013 12C4.90786 11.439 4.48222 8.55672 3.47781 7.71263C2.3618 6.7759 0 6.0965 0 6.0965C0 6.0965 2.93278 5.58439 3.77628 4.05319C4.48482 2.76903 4.90267 1.42312 4.95199 0.211023L4.95977 0C5.0584 0.602187 5.5619 3.32747 6.44173 4.28222C7.50324 5.4377 10 6.13511 10 6.13511C10 6.13511 7.32676 6.47223 6.33013 7.74351C5.5619 8.71885 5.09733 10.4611 5.04801 11.6732L5.0013 12Z"
              fill="#fff"
            />
          </svg>
          <svg x="16.218" y="17.074" width="28.7036" height="27.3605" viewBox="0 0 28.7036 27.3605" preserveAspectRatio="none">
            <path
              d="M19.0561 8.30058L15.8422 0.939613C15.3095 -0.280871 13.5616 -0.321468 12.9695 0.871104L9.37546 8.10774L1.01605 9.51345C0.0309159 9.67838 -0.34659 10.8735 0.374807 11.556L6.06841 16.9429L4.94106 25.5421C4.76783 26.8641 6.2132 27.808 7.38968 27.1407L14.7303 22.9667L22.04 27.1026C23.2345 27.7801 24.6903 26.7702 24.4369 25.4381L22.7639 16.5877L28.1886 11.6322C29.2151 10.6933 28.6127 9.00597 27.2139 8.90194L19.0561 8.29804V8.30058Z"
              fill="#E5A654"
            />
          </svg>
          <svg x="15.078" y="16.361" width="28.7036" height="27.3605" viewBox="0 0 28.7036 27.3605" preserveAspectRatio="none">
            <path
              d="M19.0561 8.30058L15.8422 0.939614C15.3095 -0.28087 13.5616 -0.321469 12.9695 0.871103L9.37545 8.10774L1.01605 9.51345C0.0309153 9.67838 -0.346589 10.8735 0.374807 11.556L6.06841 16.9429L4.94106 25.5421C4.76783 26.8641 6.2132 27.808 7.38968 27.1407L14.7303 22.9667L22.04 27.1026C23.2345 27.7801 24.6903 26.7702 24.4369 25.4381L22.7639 16.5877L28.1886 11.6322C29.2151 10.6933 28.6127 9.00597 27.2139 8.90194L19.0561 8.29804V8.30058Z"
              fill="#fff"
            />
          </svg>
        </svg>
      </span>
    </Card>
  )
}
