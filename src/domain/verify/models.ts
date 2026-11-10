export type VerifyProfile = {
  name: string;
  workspace: string;
};

export type VerifySession = {
  id: string;
  project: string;
  version: string;
  count: number;
  mode: string;
  date: string;
};
