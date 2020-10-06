<template>
  <div>
     <!-- 제목 -->
    <v-list-item>
      <v-list-item-content class='main-title'>
        <v-list-item-title class="title">Connect Setup</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider/>

    <!-- 리스트 시작 -->
    <v-list dense>
      <!-- 메인 아이템 -->
      <v-list-group v-for="(item, i) in items" :key="i" :prepend-icon="item.icon" sub-group>
        <template v-slot:activator>    
          <v-list-item-content>
            <v-list-item-title>
                {{ item.title }}
                <v-icon v-if='item.online' size=16 color='teal darken-2'>mdi-wifi</v-icon>
            </v-list-item-title>                       
          </v-list-item-content>
        </template>

        <!-- 서브 아이템 -->
        <v-list-item v-for="(subItem, j) in item.items" :key="j">
          <v-list-item-content v-if="i === 0">
            <v-select :label="subItem.title" :items="subItem.items" :value="subItem.value" hide-details dense/>
          </v-list-item-content>

          <v-list-item-content v-else>
            <v-text-field :label="subItem.title" :value="subItem.value" :placeholder="subItem.placeholder" hide-details dense/>
          </v-list-item-content>
        </v-list-item>

        <!-- 온라인 버튼 -->
        <v-list-item>
          <v-list-item-title v-if="i<5" >Online</v-list-item-title>
          <v-list-item-title v-else>On</v-list-item-title>
          <v-spacer/> 
          <v-switch :value="item.value" v-on:change="goOnline(i,value=$event)"></v-switch>
        </v-list-item>
      </v-list-group>
    </v-list>
  </div>
</template>

<script>
const ipcRenderer = window.require('electron').ipcRenderer;
let viewSetupValue = {
  showhex:false,
  sendhex:false,
  sendcrlf:false
}

export default {
  props: ['onlineStatus'],
  methods: {
    goOnline: function (id, value) {
      switch (id) {
        case 5:
          viewSetupValue.showhex = value
          console.log(viewSetupValue)
          break;
        case 6:
          viewSetupValue.sendhex = value
          console.log(viewSetupValue)
          break;
        case 7:
          viewSetupValue.sendcrlf = value
          console.log(viewSetupValue)
          break;
        default:
          this.connection(id, value)
        } 
      },
      connection: function(id, value) {
        const connect = {
          protocol: id,
          ip: this.items[id].items[0].value,
          port: this.items[id].items[1].value,
          state: value
          }
        console.log(connect)
        // this.onlineStatusSend(connect)
        ipcRenderer.send('OnConnect', connect)
      },
    },
  data () {
    return {
      items: [
      // 시리얼
        {
          title: 'Serial',
          active: true,
          online: false,
          value: false,
          icon: 'mdi-serial-port',
          items: [
            { title: 'COM',  value: 'COM1', items: ['COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8']},
            { title: 'BUAD', value: '9600', items: ['9600','14400','19200','28800','38400','57600','115200']},
          ],
        },
      //TCP 서버
        {
          title: 'TCP Server',
          online: false,
          value: false,
          icon: 'mdi-server',
          items: [
            { 
              title: 'IP',
              value: '127.0.0.1'
            },
            {
              title: 'PORT',
            },
          ],
        },
        //TCP 클라이언트
        {
          title: 'TCP Client',
          online: false,
          value: false,
          icon: 'mdi-ethernet',
          items: [
            { 
              title: 'IP',
            },
            {
              title: 'PORT',
            },
          ],
        },
        //UDP 서버
        {
          title: 'UDP Server',
          online: false,
          value: false,
          icon: 'mdi-server-network',
          items: [
            { 
              title: 'IP',
              value: '0.0.0.0',
            },
            {
              title: 'PORT',
            },
          ],
        },
        //UDP 클라이언트
        {
          title: 'UDP Client',
          online: false,
          value: false,
          icon: 'mdi-network',
          items: [
            { 
              title: 'IP',
            },
            {
              title: 'PORT',
            },
          ],
        },
        {
          title: 'Show Hex',
          online: false,
          value: false,
          icon: 'mdi-code-array',
        },
        {
          title: 'Send Hex',
          online: false,
          value: false,
          icon: 'mdi-code-array',
        },
        {
          title: 'Send CrLf',
          online: false,
          value: false,
          icon: 'mdi-code-array',
        }
      ],
    }
  },
}
</script>

<style>
  .v-text-field input{font-size: 0.8em;}
  .v-text-field label{font-size: 0.8em;}
  .v-select__selections{font-size: .8em;}
  .main-title {
    background-color: none;
    padding: 0px;
    margin: 0px;}
</style>