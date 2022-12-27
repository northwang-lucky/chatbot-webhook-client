# chatbot-webhook-client

Webhook calls of custom BOT that support DingTalk, Lark and WeCom.

# How to register a custom BOT?

| App      | Document URL                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| DingTalk | [https://open.dingtalk.com/document/group/custom-robot-access](https://open.dingtalk.com/document/group/custom-robot-access)           |
| Lark     | [https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN) |
| WeCom    | [https://developer.work.weixin.qq.com/document/path/91770](https://developer.work.weixin.qq.com/document/path/91770)                   |

# Action Usage

```yaml
steps:
  - name: Send Notification
    uses: northwang-personal/chatbot-webhook-client@latest
    with:
      # Required - DingTalk/Lark/WeCom
      app: DingTalk
      # Required - Custom BOT webhook URL
      webhook: https://xxxx
      # Optional - Used for sign
      secret: xxxx
      # Required - POST request body (JSON format)
      params: >-
        {
          "msgtype": "text",
          "text": { "content": "This is a test message." }
        } 
```
