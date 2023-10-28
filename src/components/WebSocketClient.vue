<template>
  <div class="ws-client">
    <el-form ref="dynamicValidateForm" label-width="100px" class="demo-dynamic">
      <el-form-item label="链接地址">
        <el-input v-model="form.address" placeholder="ws://ip:port">
          <template slot="prepend">ws://</template>
          <el-button slot="append" :icon="connecting ? 'el-icon-loading' : 'el-icon-link'"
                     v-if="connected || connecting" @click="close"></el-button>
          <el-button slot="append" v-if="!connected && form.address.length" :disabled="connecting" @click="open">连接
          </el-button>
        </el-input>
      </el-form-item>
      <el-form-item label="发送消息">
        <el-input v-model="form.send">
          <el-button slot="append" icon="el-icon-s-promotion" :disabled="!form.send.length || !connected"
                     @click="sendMsg"></el-button>
        </el-input>
        <el-checkbox v-model="autoSend" v-if="cmds.length">直接发送</el-checkbox>
        <el-row type="flex" justify="start" class="buttons-wrap">
          <el-button v-for="cmd in cmds" :key="cmd.label" class="buttons" size="small" type="primary" plain
                     @click="cmdClick(cmd.command)">{{ cmd.label }}
          </el-button>
          <slot name="cmds"></slot>
        </el-row>
      </el-form-item>
      <el-form-item label="消息日志" class="message">
        <!--        <el-input type="textarea" rows="20" class="scrollDom" v-model="received" readonly></el-input>-->
        <div class="result-wrap">
          <div class="result-text" v-html="received"></div>
          <el-button type="danger" icon="el-icon-delete" circle class="clear-btn" @click="clearMsg" title="清空消息"/>
          <el-button type="primary" icon="el-icon-document-copy" circle class="copy-btn" @click="copy" v-if="lastMsg"
                     title="复制最后一条结果"/>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {copyToClipboard} from "@/utils";

export default {
  name: 'WebSocketClient',
  model: {
    prop: 'address',
    event: 'address'
  },
  props: {
    cmds: {
      type: Array,
      default() {
        return []
      }
    },
    address: {
      type: String,
      default: `${location.host}`
    },
    beforeSend: {
      type: Function,
      default(command) {
        return command
      }
    }
  },
  watch: {
    'form.address'(newValue) {
      this.$emit('address', newValue)
    }
  },
  data() {
    return {
      websocket: null,
      connected: false,
      connecting: false,
      disconnect: false,
      autoSend: true,
      lastMsg: '',
      msg: '未连接',
      form: {
        address: this.address,
        send: '',
      }
    }
  },
  computed: {
    received() {
      return `${this.msg}`
    }
  },
  beforeDestroy() {
    console.log('beforeDestroy')
    this.close()
    this.removeListeners()
  },
  methods: {
    cmdClick(command) {
      this.form.send = JSON.stringify(command)
      this.autoSend && this.sendMsg()
    },
    setAndSendMessage(message) {
      this.form.send = message
      this.sendMsg()
    },
    sendMsg() {
      this.form.send = this.beforeSend(this.form.send)
      this.websocket && this.websocket.send(this.form.send)
      this.appendMsg(this.form.send, true)
    },
    now() {
      const date = new Date()
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
    },
    close() {
      if (this.websocket) {
        this.disconnect = true
        this.websocket.close()
      }
    },
    removeListeners() {
      if (this.disconnect && this.websocket) {
        this.websocket.removeEventListener('open', this.wsOpen)
        this.websocket.removeEventListener('message', this.wsMessage)
        this.websocket.removeEventListener('close', this.wsClose)
        this.websocket.removeEventListener('error', this.wsError)
      }
    },
    open() {
      if (this.connecting) return
      if (!this.form.address) {
        this.$message.warning('请输入正确的地址')
        return
      }
      this.close()
      this.connecting = true
      this.websocket = new WebSocket(`ws://${this.form.address}`)
      this.websocket.addEventListener('open', this.wsOpen)
      this.websocket.addEventListener('message', this.wsMessage)
      this.websocket.addEventListener('close', this.wsClose)
      this.websocket.addEventListener('error', this.wsError)
    },
    wsOpen() {
      this.connected = true
      this.connecting = false
      this.msg = '已连接'
      this.$emit('open')
    },
    wsMessage(event) {
      this.appendMsg(event.data)
      this.lastMsg = event.data
      this.$emit('message', event.data)
      //this.scrollDown()
    },
    wsClose(event) {
      this.connected = false
      this.connecting = false
      console.warn(event)
      this.appendMsg(`连接已断开${event.reason}`)
      if (this.disconnect) {
        this.removeListeners()
      }
      this.$emit('close')
    },
    wsError(event) {
      this.connecting = false
      console.error('WebSocket error: ', event);
      this.msg = `错误：${event}`
      this.$emit('error')
    },
    clearMsg() {
      this.msg = ''
    },
    appendMsg(msg, send) {
      this.msg = `<span style="color:${send ? '#ffdb93' : '#b1ff90'}">${send ? '--&gt; ' : '&lt;-- '}${this.now()}</span><br>${msg}<br><br>${this.msg}`
    },
    copy() {
      copyToClipboard(this.lastMsg).then(() => {
        this.$message.success('已成功复制最后一条结果')
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ws-client {
  height: 100%;
  width: 100%;
}

.demo-dynamic {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.buttons-wrap {
  flex-wrap: wrap
}

.buttons {
  margin: 6px 4px 0 0;
}

.message {
  flex: 1;
}

.message >>> .el-form-item__content {
  height: 100%;
}

.result-wrap {
  height: 100%;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  border: 1px rgba(192, 196, 204, 0.6) solid;
  border-radius: 6px;
  padding: 8px;
  background: #000;
  color: #c0c4cc;
}

.result-text::selection {
  background-color: #c0c4cc; /* 选中的文本背景色 */
  color: #000; /* 选中的文本颜色 */
}

.result-text {
  height: 100%;
  width: 100%;
  overflow: auto;
  position: absolute;
  white-space: pre-line;
  text-align: start;
  font-size: 13px;
  line-height: 20px;
}

.clear-btn {
  width: 40px;
  height: 40px;
  position: absolute;
  bottom: 4px;
  right: 20px;
  opacity: .8;
}

.copy-btn {
  width: 40px;
  height: 40px;
  position: absolute;
  bottom: 4px;
  right: 70px;
  opacity: .8;
}
</style>
