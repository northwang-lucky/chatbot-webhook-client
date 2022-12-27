import { getInput } from '@actions/core';
import { createHmac } from 'crypto';
import { stringify } from 'querystring';
import { URL_REGEX } from './constants';
import { ActionOptions, App, Body, Options, Response } from './types';
import request from 'request';

export class Client {
  app: App;

  webhook: string;

  secret: string;

  payload: Body;

  constructor() {
    const { app, webhook, secret = '', payload } = this.verify(this.getActionOptions());
    this.app = app;
    this.webhook = webhook;
    this.secret = secret;
    this.payload = payload;
  }

  private getActionOptions(): ActionOptions {
    return {
      app: getInput('app', { required: true }) as App,
      webhook: getInput('webhook', { required: true }),
      secret: getInput('secret', { required: false }),
      params: getInput('params', { required: true }),
    };
  }

  private verify({ app, webhook, secret, params }: ActionOptions): Options {
    const appNames = Object.values(App);
    if (!Object.values(App).includes(app)) {
      throw new Error(`Parameter app must be one of "${appNames.join(', ')}"`);
    }
    if (!URL_REGEX.test(webhook)) {
      throw new Error('Parameter webhook must be a URL');
    }
    let payload: Body = {};
    try {
      payload = JSON.parse(params);
    } catch (err: any) {
      throw new Error('Parameter params must be a JSON string. Error: ' + err.message);
    }
    return { app, webhook, secret, payload };
  }

  private getSign(): [string, string] {
    let timestamp = Date.now();
    let sign = '';
    if (this.app === App.DINGTALK) {
      const signData = createHmac('sha256', this.secret).update(`${timestamp}\n${this.secret}`).digest('base64');
      sign = encodeURIComponent(signData);
    }
    if (this.app === App.LARK) {
      timestamp = Math.floor(Date.now() / 1000);
      const signStr = Buffer.from(`${timestamp}\n${this.secret}`, 'utf-8');
      sign = createHmac('sha256', signStr).update(Buffer.alloc(0)).digest('base64');
    }
    return [sign, timestamp.toString()];
  }

  private getURL(): string {
    if (this.app === App.DINGTALK && this.secret) {
      const [sign, timestamp] = this.getSign();
      return `${this.webhook}&${stringify({ timestamp, sign })}`;
    }
    return this.webhook;
  }

  private getBody(): Body {
    if (this.app !== App.LARK || !this.secret) {
      return this.payload;
    }
    const [sign, timestamp] = this.getSign();
    return { timestamp, sign, ...this.payload };
  }

  private getResponseCode(response: Response): number {
    return response.code ?? response.StatusCode ?? response.errcode ?? -1;
  }

  public notify(): Promise<string> {
    const url = this.getURL();
    const body = this.getBody();
    return new Promise((resolve, reject) => {
      request.post({ url, json: true, body }, (err, _, res: Response) => {
        if (err) {
          reject(err);
          return;
        }
        const response = JSON.stringify(res);
        if (this.getResponseCode(res) !== 0) {
          reject(response);
          return;
        }
        resolve(response);
      });
    });
  }
}
