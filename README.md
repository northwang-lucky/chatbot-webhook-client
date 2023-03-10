# chatbot-webhook-client

Webhook calls of custom BOT that support DingTalk, Lark and WeCom.

## How to register a custom BOT?

| App      | Document URL                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| DingTalk | [https://open.dingtalk.com/document/group/custom-robot-access](https://open.dingtalk.com/document/group/custom-robot-access)           |
| Lark     | [https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN) |
| WeCom    | [https://developer.work.weixin.qq.com/document/path/91770](https://developer.work.weixin.qq.com/document/path/91770)                   |

## Action Usage

Usage of **v1.1.0** and later

```yaml
steps:
  - name: Send Notification
    uses: northwang-lucky/chatbot-webhook-client@latest
    with:
      # Required - DingTalk/Lark/WeCom
      app: DingTalk
      # Required - Custom BOT webhook URL
      webhook: https://xxxx
      # Optional - Used for sign
      secret: xxxx
      # Required - POST request body (JSON format string)
      # If there are some double quotes '"' in your json body, please use '\"'
      template: >-
        {
          "msgtype": "text",
          "text": { "content": "This is a test message." }
        }
      # Or a JSON file URI (Relative to the repository root)
      # Also, if there are special characters like '\n', '\r', '\t', '\f' in the JSON string, write it like this: '\\n'
      # The content of the template file can refer to this:
      # https://github.com/northwang-personal/chatbot-webhook-client/blob/master/.template/message.json
      template: file://.template/message.json
      # Required if template is a file URI - Parameters for file template (JSON format string)
      params: >-
        {
          "title": "xxx",
          "content": "xxx"
        }
      # Required if template is a file URI - Workflow will generate a GITHUB_TOKEN in secrets automatically, you can direct use "${{ secrets.GITHUB_TOKEN }}"
      github-token: ${{ secrets.GITHUB_TOKEN }}
      # Optional - The branch where the file resides (Defaults main)
      branch: main
```

Usage before v1.1.0

```yaml
steps:
  - name: Send Notification
    uses: northwang-lucky/chatbot-webhook-client@v1.0.1
    with:
      # Required - DingTalk/Lark/WeCom
      app: DingTalk
      # Required - Custom BOT webhook URL
      webhook: https://xxxx
      # Optional - Used for sign
      secret: xxxx
      # Required - POST request body (JSON format)
      # If there are some double quotes '"' in your json body, please use '\"'
      params: >-
        {
          "msgtype": "text",
          "text": { "content": "This is a test message." }
        }
```
