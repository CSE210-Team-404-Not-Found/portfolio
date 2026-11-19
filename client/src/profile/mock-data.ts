// fake data for the profile page until #18 is done
// field names are the same as Max's lexicons (com.at-folio.temp.project and com.at-folio.temp.profile)
// so when the real records are ready only this file should need to change

export type MockProject = {
  // record key, this is the :pid in /profile/:handle/project/:pid
  rkey: string
  title: string
  summary: string
  // the real record has a blob here but the page just needs a url to show it
  thumbnailUrl?: string
}

export type MockPortfolioProfile = {
  jobTitle?: string
  description?: string
  // not in the lexicon yet but Max said we'd want links (linkedin etc) and the figma has them
  links?: { label: string; url: string }[]
}

const portfolioProfile: MockPortfolioProfile = {
  jobTitle: 'Student developer',
  description:
    'Placeholder intro. This is where someone writes about themselves, what they work on and what they are looking for.',
  links: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'GitHub', url: 'https://github.com/' },
  ],
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

// everyone gets the same intro for now
export function getMockPortfolioProfile(): MockPortfolioProfile {
  return portfolioProfile
}

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
