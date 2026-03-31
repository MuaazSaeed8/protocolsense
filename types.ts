export interface ExamplePair {
  id: string;
  input: string;
  output: string;
}

export interface ExtractedExample {
  input: string;
  output: string;
}

export interface Rule {
  id: string;
  description: string;
  confidence: number;
  evidence: string;
  supporting_examples: string[];
}

export interface AnalysisResult {
  system_summary: string;
  rules: Rule[];
  edge_cases: string[];
  ambiguities: string[];
}

export interface AnalysisVersion {
  id: string;
  name: string;
  timestamp: number;
  result: AnalysisResult;
}

export interface RuleDiff {
  id: string;
  type: 'NEW' | 'CHANGED' | 'REMOVED' | 'UNCHANGED';
  description: string;
  oldDescription?: string;
  confidence: number;
  oldConfidence?: number;
  breakingImpact?: string;
}

export interface ComparisonResult {
  summary: string;
  added_rules: string[];
  removed_rules: string[];
  modified_rules: { id: string; change_reason: string }[];
  backward_compatibility_impact: 'LOW' | 'MEDIUM' | 'HIGH';
  concrete_break_example: string;
  diffs: RuleDiff[];
}

export interface TestCase {
  type: 'valid' | 'edge';
  input: string;
  expected: string;
  testing_what: string;
}

export interface TestSuite {
  tests: TestCase[];
}

export interface ValidationAttempt {
  id: string;
  input: string;
  status: 'VALID' | 'INVALID' | 'UNDEFINED';
  violated_rules: string[];
  explanation: string;
  suggested_fix?: string;
  timestamp: number;
}

export interface DiagnosisResult {
  error_summary: string;
  violated_rule_id?: string;
  detailed_explanation: string;
  suggested_fix: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Project {
  id: string;
  name: string;
  examples: ExamplePair[];
  versions: AnalysisVersion[];
  valHistory: ValidationAttempt[];
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Scenario {
  id: string;
  icon: string;
  title: string;
  problem: string;
  examples: ExamplePair[];
}