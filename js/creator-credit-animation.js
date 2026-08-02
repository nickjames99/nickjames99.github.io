(() => {
  const credit = document.querySelector(".creator-credit");
  if (!credit) return;

  const styleId = "creator-credit-gradient-motion";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes creatorCreditGradientShift {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }

      .creator-credit.credit-gradient-motion,
      .creator-credit.credit-gradient-motion strong,
      .creator-credit.credit-gradient-motion::before,
      .creator-credit.credit-gradient-motion::after {
        background-image: linear-gradient(
          90deg,
          #FFD67A 0%,
          #F8B6D8 20%,
          #C5A3FF 40%,
          #61D4FF 60%,
          #74F0B7 80%,
          #FFD67A 100%
        );
        background-size: 300% 100%;
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
        animation: creatorCreditGradientShift 5s ease-in-out infinite alternate;
      }

      @media (prefers-reduced-motion: reduce) {
        .creator-credit.credit-gradient-motion,
        .creator-credit.credit-gradient-motion strong,
        .creator-credit.credit-gradient-motion::before,
        .creator-credit.credit-gradient-motion::after {
          animation: none;
          background-position: 50% 50%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  credit.classList.add("credit-gradient-motion");
})();
