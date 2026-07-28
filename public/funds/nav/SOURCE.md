# Bottom-navigation artwork

Supplied by the designer as production exports:

- `home.svg`, `home-active.svg`
- `scan.svg`
- `transaction.svg`, `transaction-active.svg`
- `celengan-active.svg`, `modal-active.svg`

**Derived, not supplied — replace with real exports when they exist:**

- `celengan.svg`, `modal.svg` — the inactive states. Made by flattening the
  supplied active artwork to `#8E95A3` (`neutral-500`), which is the rule the
  supplied `transaction` pair follows and the flat silhouette style the supplied
  `home.svg` is drawn in.
- `scan-active.svg` — the active state, made by recolouring the supplied gray
  `scan.svg` to `#853291` (`primary-500`). `scan` is single-tone in both states,
  so this one carries the least risk.

All three are geometry-preserving recolours; none invents new paths. Still, they
are guesses at artwork the designer owns, so treat them as placeholders.
