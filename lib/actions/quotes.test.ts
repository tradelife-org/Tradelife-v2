// ============================================================================
// TradeLife v2 - Pricing Engine Tests
// Validates all calculation logic with concrete examples.
// Run with: npx tsx /app/lib/actions/quotes.test.ts
// ============================================================================

import {
  calculateSection,
  calculateQuoteTotals,
  calculateLineTotal,
  recalculateQuote,
  penceToPounds,
  formatCurrency,
  formatPercentage,
  poundsToPence,
  percentageToStored,
  type SectionInput,
} from './quotes';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}${details ? ` — ${details}` : ''}`);
    failed++;
  }
}

// ============================================================================
// TEST 1: Direct Labour Section
// Scenario: Electrician, 5 days @ £250/day, £500 materials, 25% margin
// ============================================================================

console.log('\n=== TEST 1: Direct Labour Section ===');
{
  const input: SectionInput = {
    is_subcontract: false,
    labour_days: 5,
    labour_day_rate: 25000,        // £250.00 = 25000 pence
    subcontract_cost: 0,
    material_cost_total: 50000,    // £500.00 = 50000 pence
    margin_percentage: 2500,       // 25.00%
  };

  const result = calculateSection(input);

  // Labour: 5 × 25000 = 125000 pence (£1,250.00)
  assert(result.labour_cost === 125000, 
    'Labour cost = £1,250.00',
    `Got: ${penceToPounds(result.labour_cost)}`);

  // Cost: 125000 + 50000 = 175000 pence (£1,750.00)
  assert(result.section_cost_total === 175000, 
    'Section cost = £1,750.00',
    `Got: ${penceToPounds(result.section_cost_total)}`);

  // Revenue: 175000 + (175000 × 2500 / 10000) = 175000 + 43750 = 218750 (£2,187.50)
  assert(result.section_revenue_total === 218750, 
    'Section revenue = £2,187.50',
    `Got: ${penceToPounds(result.section_revenue_total)}`);

  // Profit: 218750 - 175000 = 43750 (£437.50)
  assert(result.section_profit === 43750, 
    'Section profit = £437.50',
    `Got: ${penceToPounds(result.section_profit)}`);
}

// ============================================================================
// TEST 2: Subcontract Section
// Scenario: Plumbing subcontractor £3,000, £200 materials, 15% margin
// ============================================================================

console.log('\n=== TEST 2: Subcontract Section ===');
{
  const input: SectionInput = {
    is_subcontract: true,
    labour_days: 0,
    labour_day_rate: 0,
    subcontract_cost: 300000,      // £3,000.00
    material_cost_total: 20000,    // £200.00
    margin_percentage: 1500,       // 15.00%
  };

  const result = calculateSection(input);

  // Labour (subcontract): 300000 pence (£3,000.00)
  assert(result.labour_cost === 300000, 
    'Labour cost (subcontract) = £3,000.00',
    `Got: ${penceToPounds(result.labour_cost)}`);

  // Cost: 300000 + 20000 = 320000 (£3,200.00)
  assert(result.section_cost_total === 320000, 
    'Section cost = £3,200.00',
    `Got: ${penceToPounds(result.section_cost_total)}`);

  // Revenue: 320000 + (320000 × 1500 / 10000) = 320000 + 48000 = 368000 (£3,680.00)
  assert(result.section_revenue_total === 368000, 
    'Section revenue = £3,680.00',
    `Got: ${penceToPounds(result.section_revenue_total)}`);

  // Profit: 368000 - 320000 = 48000 (£480.00)
  assert(result.section_profit === 48000, 
    'Section profit = £480.00',
    `Got: ${penceToPounds(result.section_profit)}`);
}

// ============================================================================
// TEST 3: Quote Totals (combining both sections above)
// ============================================================================

console.log('\n=== TEST 3: Quote Totals (2 sections combined) ===');
{
  const section1 = calculateSection({
    is_subcontract: false,
    labour_days: 5,
    labour_day_rate: 25000,
    subcontract_cost: 0,
    material_cost_total: 50000,
    margin_percentage: 2500,
  });

  const section2 = calculateSection({
    is_subcontract: true,
    labour_days: 0,
    labour_day_rate: 0,
    subcontract_cost: 300000,
    material_cost_total: 20000,
    margin_percentage: 1500,
  });

  const totals = calculateQuoteTotals({
    sections: [section1, section2],
    vat_rate: 2000,  // 20.00% VAT
  });

  // Net: 218750 + 368000 = 586750 (£5,867.50)
  assert(totals.quote_amount_net === 586750, 
    'Quote net = £5,867.50',
    `Got: ${penceToPounds(totals.quote_amount_net)}`);

  // Cost: 175000 + 320000 = 495000 (£4,950.00)
  assert(totals.quote_total_cost === 495000, 
    'Quote cost = £4,950.00',
    `Got: ${penceToPounds(totals.quote_total_cost)}`);

  // Profit: 586750 - 495000 = 91750 (£917.50)
  assert(totals.quote_profit === 91750, 
    'Quote profit = £917.50',
    `Got: ${penceToPounds(totals.quote_profit)}`);

  // Margin%: (91750 / 495000) × 10000 = 1853 (18.53%)
  const expectedMargin = Math.round((91750 * 10000) / 495000);
  assert(totals.quote_margin_percentage === expectedMargin, 
    `Quote margin = ${formatPercentage(expectedMargin)}`,
    `Got: ${formatPercentage(totals.quote_margin_percentage)}`);

  // Gross: Round(586750 × (10000 + 2000) / 10000) = Round(586750 × 1.2) = 704100
  const expectedGross = Math.round((586750 * 12000) / 10000);
  assert(totals.quote_amount_gross === expectedGross, 
    `Quote gross (inc VAT) = ${penceToPounds(expectedGross)}`,
    `Got: ${penceToPounds(totals.quote_amount_gross)}`);
}

// ============================================================================
// TEST 4: Full Quote Recalculation
// ============================================================================

console.log('\n=== TEST 4: Full Quote Recalculation ===');
{
  const result = recalculateQuote({
    vat_rate: 2000,
    sections: [
      {
        is_subcontract: false,
        labour_days: 3,
        labour_day_rate: 20000,    // £200/day
        subcontract_cost: 0,
        material_cost_total: 10000, // £100
        margin_percentage: 3000,    // 30%
      },
    ],
  });

  // Labour: 3 × 20000 = 60000 (£600)
  assert(result.sections[0].labour_cost === 60000, 
    'Section labour = £600.00',
    `Got: ${penceToPounds(result.sections[0].labour_cost)}`);

  // Cost: 60000 + 10000 = 70000 (£700)
  assert(result.sections[0].section_cost_total === 70000,
    'Section cost = £700.00',
    `Got: ${penceToPounds(result.sections[0].section_cost_total)}`);

  // Revenue: 70000 + (70000 × 3000 / 10000) = 70000 + 21000 = 91000 (£910)
  assert(result.sections[0].section_revenue_total === 91000,
    'Section revenue = £910.00',
    `Got: ${penceToPounds(result.sections[0].section_revenue_total)}`);

  // Gross: Round(91000 × 12000 / 10000) = Round(109200) = 109200 (£1,092.00)
  assert(result.totals.quote_amount_gross === 109200,
    'Quote gross = £1,092.00',
    `Got: ${penceToPounds(result.totals.quote_amount_gross)}`);
}

// ============================================================================
// TEST 5: Line Item Calculation
// ============================================================================

console.log('\n=== TEST 5: Line Item Calculation ===');
{
  // 10 units @ £45.50 each = £455.00 = 45500 pence
  const total = calculateLineTotal(10, 4550);
  assert(total === 45500, 
    'Line total: 10 × £45.50 = £455.00',
    `Got: ${penceToPounds(total)}`);

  // 1 unit @ £1,200 = 120000 pence
  const total2 = calculateLineTotal(1, 120000);
  assert(total2 === 120000, 
    'Line total: 1 × £1,200.00 = £1,200.00',
    `Got: ${penceToPounds(total2)}`);
}

// ============================================================================
// TEST 6: Edge Cases
// ============================================================================

console.log('\n=== TEST 6: Edge Cases ===');
{
  // Zero margin
  const zeroMargin = calculateSection({
    is_subcontract: false,
    labour_days: 1,
    labour_day_rate: 10000,
    subcontract_cost: 0,
    material_cost_total: 0,
    margin_percentage: 0,
  });
  assert(zeroMargin.section_revenue_total === 10000, 
    'Zero margin: revenue = cost',
    `Got: revenue=${penceToPounds(zeroMargin.section_revenue_total)}, cost=${penceToPounds(zeroMargin.section_cost_total)}`);
  assert(zeroMargin.section_profit === 0, 
    'Zero margin: profit = 0');

  // Zero cost (no work)
  const zeroCost = calculateSection({
    is_subcontract: false,
    labour_days: 0,
    labour_day_rate: 0,
    subcontract_cost: 0,
    material_cost_total: 0,
    margin_percentage: 2500,
  });
  assert(zeroCost.section_cost_total === 0, 'Zero cost: total = 0');
  assert(zeroCost.section_revenue_total === 0, 'Zero cost: revenue = 0');

  // Zero VAT
  const noVat = calculateQuoteTotals({
    sections: [{ labour_cost: 0, section_cost_total: 10000, section_revenue_total: 12500, section_profit: 2500 }],
    vat_rate: 0,
  });
  assert(noVat.quote_amount_gross === noVat.quote_amount_net, 
    'Zero VAT: gross = net');

  // Division by zero guard on margin
  const noCostMargin = calculateQuoteTotals({
    sections: [{ labour_cost: 0, section_cost_total: 0, section_revenue_total: 0, section_profit: 0 }],
    vat_rate: 2000,
  });
  assert(noCostMargin.quote_margin_percentage === 0, 
    'Zero cost: margin% = 0 (no div by zero)');
}

// ============================================================================
// TEST 7: Display Helpers
// ============================================================================

console.log('\n=== TEST 7: Display Helpers ===');
{
  assert(penceToPounds(15050) === '150.50', 'penceToPounds: 15050 -> 150.50');
  assert(penceToPounds(100) === '1.00', 'penceToPounds: 100 -> 1.00');
  assert(penceToPounds(1) === '0.01', 'penceToPounds: 1 -> 0.01');
  assert(penceToPounds(0) === '0.00', 'penceToPounds: 0 -> 0.00');

  assert(formatPercentage(2500) === '25.00%', 'formatPercentage: 2500 -> 25.00%');
  assert(formatPercentage(0) === '0.00%', 'formatPercentage: 0 -> 0.00%');

  assert(poundsToPence(150.50) === 15050, 'poundsToPence: 150.50 -> 15050');
  assert(poundsToPence(0.01) === 1, 'poundsToPence: 0.01 -> 1');

  assert(percentageToStored(25.5) === 2550, 'percentageToStored: 25.5 -> 2550');
  assert(percentageToStored(20) === 2000, 'percentageToStored: 20 -> 2000');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n==========================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('==========================================\n');

if (failed > 0) {
  process.exit(1);
}
