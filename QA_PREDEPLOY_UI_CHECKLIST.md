# QA Predeploy UI Checklist

## Home / Entry
- Landing view renders without layout shifts
- Primary CTA visible and accessible
- No horizontal scrolling on mobile

## Main Flows
- Core navigation works end-to-end
- Auth or gating states render correctly
- Error/empty states show expected copy

## Forms / Interactions
- Inputs accept and validate data correctly
- Buttons have clear disabled/loading states
- Focus states are visible

## Mobile Layout
- Content fits within 375px width without overflow
- Tap targets are at least 44px high
- Text remains readable without zoom

## Build
- `npm run build` succeeds
- Tailwind utilities present in compiled CSS
- No console errors on initial load
