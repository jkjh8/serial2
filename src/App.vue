<template>
  <v-app>
    <v-app-bar app class="primary" dark flat height=49px>
      <v-app-bar-nav-icon @click="drawer=!drawer"/>
      <v-spacer/>
      <v-icon v-if="online" color="green">mdi-wifi</v-icon>
      <v-icon v-else color="red">mdi-wifi-off</v-icon>
    </v-app-bar>

    <v-navigation-drawer app v-model="drawer" fixed >
      <site-menu/>
    </v-navigation-drawer>

    <v-main>
      <v-container>
        <v-card>
          <v-data-table :headers="headers" :items="items" :sort-by="sortby" :sort-desc="sortdesc" dense>
              <template v-slot:item.createAt="{ item }">
                {{ item.createAt.toLocaleString() }}
              </template>
              <!-- <template v-slot:item.msg="{ item }">
                {{ item.msg }}
              </template> -->
          </v-data-table>
        </v-card>
      </v-container>
    </v-main>

    <site-footer/>
  </v-app>
</template>

<script>
const ipcRenderer = window.require('electron').ipcRenderer;
import SiteMenu from './components/Menu';
import SiteFooter from './components/Footer';
let onlineState = [false, false, false, false, false]

export default {
  name: 'App',

  components: {
    SiteMenu,
    SiteFooter
  },
  data (){
    return {
      drawer: true,
      online: false,
      sortby: 'createAt',
      sortdesc: true,
      headers: [
          {value:'createAt', text: '시간', width: '180px'},
          {value:'protocol', text: '프로토콜', width: '100px'},
          {value: 'from', text: '발신', width: '100px'},
          {value: 'msg', text: '값'}
      ],
      items : [],

    }
  },
  mounted() {
    this.$eventBus.$on('goOnlineValue', (id, ip, port, status) => {
      let obj ={};
      obj["protocol"] = id
      obj["ip"] = ip
      obj["port"] = port
      obj["status"] = status
      ipcRenderer.send('OnConnect', JSON.stringify(obj))        
    }),
    this.$eventBus.$on('sendString', msg => {
      console.log('main recv = '+ msg)
      ipcRenderer.send('sendMsg', msg)
      this.$eventBus.$emit('addMsg', 'TCP Serv', 'This', msg)
    }),
    ipcRenderer.on('rtMsg', (e, id, from, msg) =>{
      this.$eventBus.$emit('addMsg', id, from, msg)      
    })
    ipcRenderer.on('onlineState', (e, id, value) => {
      onlineState[id] = value;
      for (let module of onlineState) {
        console.log(module)
        if (module === true) {
          this.online = true
          break
        }
        this.online = false
      }
    })
  },
  methods: {
    //
  }
}
</script>

<style>

</style>
