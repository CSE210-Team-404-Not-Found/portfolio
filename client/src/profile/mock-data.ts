// fake data for the profile page until #18 is done
// field names are the same as Max's project lexicon (com.at-folio.temp.project)
// so when the real records are ready only this file should need to change

export type MockProject = {
  // record key, this is the :pid in /profile/:handle/project/:pid
  rkey: string
  title: string
  summary: string
  // the real record has a blob here but the page just needs a url to show it
  thumbnailUrl?: string
}

const projects: MockProject[] = [
  {
    rkey: '3lbmockproj01',
    title: 'OpenShowcase',
    summary: 'A portfolio site where your project pages live in your own AT Protocol account.',
  },
  {
    rkey: '3lbmockproj02',
    title: 'Campus Bike Map',
    summary: 'A map of bike racks and repair stations around campus, built for a hackathon.',
  },
  {
    rkey: '3lbmockproj03',
    title: 'Study Buddy Bot',
    summary: 'A Discord bot that pairs up classmates for study sessions before exams.',
  },
]

// everyone gets the same projects for now
// the real one will need the handle or did of whose records to read
export function getMockProjects(): MockProject[] {
  return projects
}

export function getMockProject(rkey: string): MockProject | undefined {
  for (const project of projects) {
    if (project.rkey === rkey) {
      return project
    }
  }
  return undefined
}
