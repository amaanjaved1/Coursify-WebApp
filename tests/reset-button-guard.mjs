/**
 * Reset button guard test — Issue #71
 *
 * Simulates rapid reset button clicks under two scenarios:
 *   1. No filters active  → after fix: 0 fetches triggered
 *   2. Filters active     → after fix: 1 fetch triggered (correct)
 *
 * Usage: node tests/reset-button-guard.mjs
 */

import { performance } from "perf_hooks"

const DEFAULT_SORT = { key: "availability", direction: "descending" }

// ---------------------------------------------------------------------------
// Helpers — mirrors the logic in queens/page.tsx
// ---------------------------------------------------------------------------

function hasActiveFilters(state) {
  const availabilityFilterActive =
    !state.selectedAvailability.includes("data") ||
    !state.selectedAvailability.includes("comments")
  return (
    state.debouncedSearch !== "" ||
    state.selectedDepartments.length > 0 ||
    state.selectedLevels.length > 0 ||
    state.selectedSubjects.length > 0 ||
    availabilityFilterActive ||
    state.gpaRange[0] > 0 ||
    state.gpaRange[1] < 4.3 ||
    state.enrollmentRange[0] > 0 ||
    state.enrollmentRange[1] > 0
  )
}

function sortIsAtDefault(sortConfig) {
  return sortConfig.key === DEFAULT_SORT.key && sortConfig.direction === DEFAULT_SORT.direction
}

function defaultState() {
  return {
    searchTerm: "",
    debouncedSearch: "",
    selectedDepartments: [],
    selectedLevels: [],
    selectedSubjects: [],
    gpaRange: [0, 4.3],
    enrollmentRange: [0, 0],
    selectedAvailability: ["data", "comments"],
    sortConfig: { ...DEFAULT_SORT },
    currentPage: 1,
  }
}

// Simulates the OLD resetFilters — always triggers a state update (fetch)
function resetBefore(state) {
  return {
    ...state,
    searchTerm: "",
    debouncedSearch: "",
    selectedDepartments: [],
    selectedLevels: [],
    selectedSubjects: [],
    gpaRange: [0, 4.3],
    enrollmentRange: [0, 0],
    selectedAvailability: ["data", "comments"],
    sortConfig: { ...DEFAULT_SORT },
    currentPage: 1,
    _fetched: true,  // always fetches
  }
}

// Simulates the NEW resetFilters — guards against no-op resets
function resetAfter(state) {
  if (
    !hasActiveFilters(state) &&
    sortIsAtDefault(state.sortConfig) &&
    state.searchTerm === "" &&
    state.currentPage === 1
  ) {
    return state  // no-op, no fetch triggered
  }
  return {
    ...state,
    searchTerm: "",
    debouncedSearch: "",
    selectedDepartments: [],
    selectedLevels: [],
    selectedSubjects: [],
    gpaRange: [0, 4.3],
    enrollmentRange: [0, 0],
    selectedAvailability: ["data", "comments"],
    sortConfig: { ...DEFAULT_SORT },
    currentPage: 1,
    _fetched: true,
  }
}

// ---------------------------------------------------------------------------
// Scenario runner
// ---------------------------------------------------------------------------

function runScenario(label, initialState, clicks, resetFn) {
  let state = initialState
  let fetchCount = 0
  const start = performance.now()

  for (let i = 0; i < clicks; i++) {
    const next = resetFn(state)
    if (next._fetched && next !== state) {
      fetchCount++
      state = { ...next, _fetched: false }
    }
  }

  const elapsed = (performance.now() - start).toFixed(3)
  return { label, fetchCount, elapsed }
}

const CLICKS = 20

// ---------------------------------------------------------------------------
// Test 1: No filters active — spam reset 20 times
// ---------------------------------------------------------------------------
const noFiltersState = defaultState()

const t1Before = runScenario("Before (no filters)", noFiltersState, CLICKS, resetBefore)
const t1After  = runScenario("After  (no filters)", noFiltersState, CLICKS, resetAfter)

// ---------------------------------------------------------------------------
// Test 2: Filters active — spam reset 20 times
// ---------------------------------------------------------------------------
const withFiltersState = {
  ...defaultState(),
  debouncedSearch: "math",
  selectedDepartments: ["MATH"],
  selectedLevels: ["300"],
}

const t2Before = runScenario("Before (with filters)", withFiltersState, CLICKS, resetBefore)
const t2After  = runScenario("After  (with filters)", withFiltersState, CLICKS, resetAfter)

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

console.log(`\n=== Reset Button Guard — ${CLICKS} rapid clicks ===\n`)

console.log("Scenario 1: No filters active (spam clicking reset does nothing useful)")
console.log(`  ${t1Before.label}: ${t1Before.fetchCount} fetches triggered  (${t1Before.elapsed} ms)`)
console.log(`  ${t1After.label} : ${t1After.fetchCount} fetches triggered  (${t1After.elapsed} ms)`)
const saved1 = t1Before.fetchCount - t1After.fetchCount
console.log(`  Saved: ${saved1} unnecessary fetches\n`)

console.log("Scenario 2: Filters active (reset should still work)")
console.log(`  ${t2Before.label}: ${t2Before.fetchCount} fetches triggered`)
console.log(`  ${t2After.label} : ${t2After.fetchCount} fetches triggered`)
console.log(`  Behaviour preserved: ${t2After.fetchCount === 1 ? "yes" : "NO — regression!"}\n`)

// ---------------------------------------------------------------------------
// Pass / fail
// ---------------------------------------------------------------------------

const checks = [
  { name: "No fetches triggered when no filters active (after)", pass: t1After.fetchCount === 0 },
  { name: "Exactly 1 fetch triggered when filters active (after)", pass: t2After.fetchCount === 1 },
  { name: "Before fix: all 20 clicks triggered fetches (no filters)", pass: t1Before.fetchCount === CLICKS },
]

let allPassed = true
for (const { name, pass } of checks) {
  console.log(`${pass ? "✓" : "✗"} ${name}`)
  if (!pass) allPassed = false
}

console.log()
if (!allPassed) process.exit(1)
