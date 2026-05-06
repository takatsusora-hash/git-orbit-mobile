export type CheckState = "pass" | "fail" | "unknown";
export type ModuleStatus =
  | "empty"
  | "skeleton"
  | "building"
  | "implemented"
  | "verified"
  | "broken";
export type ConnectionStatus = "active" | "planned" | "broken" | "untested";
export type ModuleType =
  | "ui"
  | "api"
  | "service"
  | "db"
  | "workflow"
  | "external";
export type ConnectionKind =
  | "import"
  | "api"
  | "db"
  | "workflow"
  | "deploy"
  | "external";

export type Evidence = {
  type: "commit" | "pr" | "issue" | "action" | "artifact" | "deploy";
  title: string;
  url: string;
  status?: "pass" | "fail" | "open" | "merged";
  createdAt?: string;
};

export type ModuleChecks = {
  exists: boolean;
  build: CheckState;
  typecheck: CheckState;
  test: CheckState;
  deploy: CheckState;
  runtime: CheckState;
  coverage?: number;
  lastUpdatedAt?: string;
};

export type RepoRef = {
  owner: string;
  name: string;
  branch?: string;
};

export type RepoSnapshot = RepoRef & {
  url: string;
  isPrivate: boolean;
  updatedAt: string;
  pushedAt?: string;
  defaultBranch?: string;
  openPullRequests: number;
  openIssues: number;
  latestWorkflow?: {
    name: string;
    status: "pass" | "fail" | "unknown";
    url: string;
  };
  primaryLanguage?: string;
};

export type Module = {
  id: string;
  name: string;
  systemId: string;
  repo: string;
  path: string;
  type: ModuleType;
  progress: number;
  status: ModuleStatus;
  checks: ModuleChecks;
  evidence: Evidence[];
  position?: [number, number, number];
};

export type ModuleConnection = {
  id: string;
  from: string;
  to: string;
  kind: ConnectionKind;
  status: ConnectionStatus;
  strength: number;
  evidence: Evidence[];
};

export type SystemStatus = {
  progress: number;
  errors: number;
  warnings: number;
  verifiedModules: number;
  updatedAt: string;
};

export type System = {
  id: string;
  name: string;
  repos: RepoRef[];
  repoSnapshots: RepoSnapshot[];
  modules: Module[];
  connections: ModuleConnection[];
  overallStatus: SystemStatus;
  tags: string[];
  summary: string;
  mode: "live" | "mapped";
};

export type WorkspaceConfig = {
  accounts: Array<{
    id: string;
    name: string;
    tokenEnv?: string;
  }>;
  systems: Array<{
    id: string;
    name: string;
    owner: string;
    repos: string[];
    localPath?: string;
    mapFile?: string;
    tags?: string[];
    summary?: string;
  }>;
};

export type SystemMapFile = {
  system: {
    id: string;
    name: string;
    summary: string;
    tags?: string[];
  };
  repos: RepoRef[];
  modules: Array<{
    id: string;
    name: string;
    repo: string;
    path: string;
    type: ModuleType;
  }>;
  connections: Array<{
    from: string;
    to: string;
    kind: ConnectionKind;
    status?: ConnectionStatus;
    strength?: number;
    evidence?: Evidence[];
  }>;
};

export type StatusFile = {
  systemId: string;
  updatedAt: string;
  modules: Array<{
    id: string;
    progressSignals: {
      pathExists: boolean;
      keyFiles: boolean;
      linkedWork: boolean;
      mergedToMain: boolean;
      build: CheckState;
      typecheck: CheckState;
      test: CheckState;
      deploy: CheckState;
      runtime: CheckState;
    };
    checks: ModuleChecks;
    evidence: Evidence[];
  }>;
  connections?: Array<{
    from: string;
    to: string;
    status: ConnectionStatus;
    evidence?: Evidence[];
  }>;
};
