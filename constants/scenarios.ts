import { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'undocumented',
    icon: 'settings_input_component',
    title: 'Undocumented internal API',
    problem: "Your company's pricing API has been running for 5 years. The original developer left, documentation doesn't exist, and new engineers spend days figuring out how it works through trial and error.",
    examples: [
      { id: 'ex1', input: '{ "item": "book", "quantity": 1, "member": false }', output: '{ "subtotal": 20, "discount": 0, "shipping": 10, "total": 30 }' },
      { id: 'ex2', input: '{ "item": "book", "quantity": 1, "member": true }', output: '{ "subtotal": 20, "discount": 4, "shipping": 10, "total": 26 }' },
      { id: 'ex3', input: '{ "item": "pen", "quantity": 10, "member": false }', output: '{ "subtotal": 50, "discount": 0, "shipping": 10, "total": 60 }' },
      { id: 'ex4', input: '{ "item": "book", "quantity": 6, "member": false }', output: '{ "subtotal": 120, "discount": 0, "shipping": 0, "total": 120 }' },
      { id: 'ex5', input: '{ "item": "book", "quantity": 6, "member": true }', output: '{ "subtotal": 120, "discount": 24, "shipping": 0, "total": 96 }' },
      { id: 'ex6', input: '{ "item": "laptop", "quantity": 1, "member": false }', output: '{ "subtotal": 999, "discount": 99.90, "shipping": 0, "total": 899.10 }' },
      { id: 'ex7', input: '{ "item": "laptop", "quantity": 1, "member": true }', output: '{ "subtotal": 999, "discount": 299.70, "shipping": 0, "total": 699.30 }' }
    ]
  },
  {
    id: 'migration',
    icon: 'sync_alt',
    title: 'Legacy system migration',
    problem: "You're migrating from an old payment gateway to a new one. You need to ensure identical behavior, but nobody remembers all the edge cases. One missed rule could mean financial discrepancies.",
    examples: [
      { id: 'pay1', input: '{ "amount": 100, "currency": "USD", "type": "credit", "region": "domestic" }', output: '{ "fee": 2.90, "exchange_rate": 1, "converted": 100, "total": 102.90 }' },
      { id: 'pay2', input: '{ "amount": 100, "currency": "USD", "type": "debit", "region": "domestic" }', output: '{ "fee": 1.50, "exchange_rate": 1, "converted": 100, "total": 101.50 }' },
      { id: 'pay3', input: '{ "amount": 100, "currency": "EUR", "type": "credit", "region": "international" }', output: '{ "fee": 4.20, "exchange_rate": 1.08, "converted": 108, "total": 112.20 }' },
      { id: 'pay4', input: '{ "amount": 500, "currency": "USD", "type": "credit", "region": "domestic" }', output: '{ "fee": 12.50, "exchange_rate": 1, "converted": 500, "total": 512.50 }' },
      { id: 'pay5', input: '{ "amount": 1000, "currency": "GBP", "type": "wire", "region": "international" }', output: '{ "fee": 25, "exchange_rate": 1.27, "converted": 1270, "total": 1295 }' },
      { id: 'pay6', input: '{ "amount": 50, "currency": "USD", "type": "credit", "region": "domestic" }', output: '{ "fee": 1.95, "exchange_rate": 1, "converted": 50, "total": 51.95 }' }
    ]
  },
  {
    id: 'integration',
    icon: 'hub',
    title: 'Third-party API integration',
    problem: "You're integrating a vendor's shipping API. Their documentation is outdated and incomplete. The actual behavior doesn't match what's written. Your team wastes hours debugging unexpected responses.",
    examples: [
      { id: 'ship1', input: '{ "weight": 2, "dimensions": "10x10x10", "zone": "domestic", "service": "standard" }', output: '{ "cost": 8.99, "carrier": "USPS", "days": 5, "tracking": true }' },
      { id: 'ship2', input: '{ "weight": 2, "dimensions": "10x10x10", "zone": "domestic", "service": "express" }', output: '{ "cost": 24.99, "carrier": "FedEx", "days": 2, "tracking": true }' },
      { id: 'ship3', input: '{ "weight": 15, "dimensions": "20x20x20", "zone": "domestic", "service": "standard" }', output: '{ "cost": 18.99, "carrier": "UPS", "days": 5, "tracking": true }' },
      { id: 'ship4', input: '{ "weight": 2, "dimensions": "10x10x10", "zone": "international", "service": "standard" }', output: '{ "cost": 32.99, "carrier": "DHL", "days": 10, "tracking": true }' },
      { id: 'ship5', input: '{ "weight": 2, "dimensions": "10x10x10", "zone": "international", "service": "express" }', output: '{ "cost": 65.99, "carrier": "DHL", "days": 3, "tracking": true }' },
      { id: 'ship6', input: '{ "weight": 50, "dimensions": "40x40x40", "zone": "domestic", "service": "freight" }', output: '{ "cost": 149.99, "carrier": "FreightCo", "days": 7, "tracking": false }' }
    ]
  }
];