// Playwright's global setup: starts the local network from compose.yaml and
// returns the teardown that removes it. The image is built if it is missing.
import { fileURLToPath } from 'node:url'
import { DockerComposeEnvironment, Wait } from 'testcontainers'

const REPOSITORY = fileURLToPath(new URL('../..', import.meta.url))

export default async function startNetwork() {
  const network = await new DockerComposeEnvironment(REPOSITORY, 'compose.yaml')
    // @atproto/dev-env prints this once the accounts are seeded.
    .withWaitStrategy('atproto-1', Wait.forLogMessage('Dev environment is ready'))
    .withStartupTimeout(3 * 60 * 1000)
    .up()
  return () => network.down()
}
