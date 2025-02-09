export interface GetApplications {
  getApplications: (filePath: string) => Application[]
}

export type Application = {
  name: string
  path: string
  iconPath: string | null
}
