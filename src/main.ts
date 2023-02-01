import { setFailed, setOutput } from '@actions/core';
import { Client } from './client';

(async function (): Promise<void> {
  try {
    const client = await Client.init();
    setOutput('response', await client.notify());
  } catch (err: any) {
    if (typeof err === 'string') {
      setFailed(err);
    } else if (err instanceof Error) {
      setFailed(err.message);
    } else if (err) {
      setFailed(err.toString());
    }
  }
})();
