import { factory, formatFilename } from 'common-common/src/logging';
import { processChainNode, scheduleNodeProcessing } from './nodeProcessing';
import { rollbar } from '../../util/rollbar';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Starts an infinite loop that periodically fetches and parses blocks from
 * relevant EVM blockchains. Events parsed from these blocks are emitted
 * as chain-event notifications. The interval between each fetch is specified in milliseconds and should be
 * no more than 500k ms (500 seconds) so that we support any EVM chain that has an average block time of
 * 1 second or more (block fetching is limited to 500 blocks per interval). The recommended interval
 * is 120_000 ms (120 seconds) to avoid issues with public EVM nodes rate limiting requests.
 */
export async function startEvmPolling(
  interval: number
): Promise<NodeJS.Timeout> {
  log.info(`Starting EVM poller`);
  if (interval > 500_000) {
    throw new Error(
      `Interval for EVM polling must be at least 500_000 ms (500 seconds)`
    );
  }

  log.info(
    `All chains will be polled for events every ${interval / 1000} seconds`
  );
  await scheduleNodeProcessing(interval, processChainNode);
  return setInterval(
    scheduleNodeProcessing,
    interval,
    interval,
    processChainNode
  );
}

if (require.main === module) {
  startEvmPolling(120_000).catch((e) => {
    console.error(e);
    log.error('Evm poller shutting down due to a critical error:', e);
    rollbar.critical('Evm poller shutting down due to a critical error:', e);
    process.exit(1);
  });
}
