import { getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
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

  constructor(app: App, webhook: string, secret: string, payload: Body) {
    this.app = app;
    this.webhook = webhook;
    this.secret = secret;
    this.payload = payload;
  }

  public static async init() {
    const { app, webhook, secret, payload } = await this.verify(this.getActionOptions());
    return new Client(app, webhook, secret, payload);
  }

  private static getActionOptions(): ActionOptions {
    const app = getInput('app', { required: true }) as App;
    const webhook = getInput('webhook', { required: true });
    const secret = getInput('secret', { required: false }) || undefined;
    const template = getInput('template', { required: true });
    const params = getInput('params', { required: false }) || undefined;
    const githubToken = getInput('github-token', { required: false }) || undefined;
    const branch = getInput('branch', { required: false }) || undefined;
    return { app, webhook, secret, template, params, githubToken, branch };
  }

  private static async getTemplateByFileURI(fileURI: string, githubToken: string, branch: string): Promise<string> {
    const octokit = getOctokit(githubToken);
    const templatePath = fileURI.replace(/^file:\/\//, '');
    const { owner, repo } = context.repo;

    try {
      const response = await octokit.rest.repos.getContent({ owner, repo, path: templatePath, ref: branch });
      const data = response.data as { content: string };
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error('Something is wrong when getting file content from repository');
    }
  }

  private static async verify({
    app,
    webhook,
    secret = '',
    template,
    params,
    githubToken,
    branch = 'main',
  }: ActionOptions): Promise<Options> {
    const appNames = Object.values(App);
    if (!appNames.includes(app)) {
      throw new Error(`Parameter app must be one of "${appNames.join(', ')}"`);
    }
    if (!URL_REGEX.test(webhook)) {
      throw new Error('Parameter webhook must be a URL');
    }

    const templateIsFileURI = (template ?? '').startsWith('file://');
    if (templateIsFileURI && (!params || !githubToken)) {
      throw new Error('Parameter params and parameter githubToken is required when template is a file URI');
    }

    let payload: Body = {};
    // template maybe a json object or a file URI
    if (templateIsFileURI && params && githubToken) {
      const paramDict = JSON.parse(params);
      template = await this.getTemplateByFileURI(template, githubToken, branch);
      template = template.replace(/\$\{(.*?)\}/g, (_, f) => `\${params.${f}}`);
      template = new Function('params', `return \`${template}\``)(paramDict);
    }

    try {
      payload = JSON.parse(template);
    } catch (err: any) {
      throw new Error('Parameter template must be a JSON object or a file URI. JSON parse error: ' + err.message);
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
